好的，现在开始分析vue源码，分析过程就记录在这里。想来这个分析将是混乱的，不过没关系，慢慢来。

## 010010
想先试试能不能跑起来，先运行````yarn run dev````试了一下，发现竟然不行。多方查找发现是因为vue使用的*rollup-plugin-alias*插件对windows不友好，详情见[https://github.com/vuejs/vue/issues/2771](https://github.com/vuejs/vue/issues/2771)

## 010020
Vue的入口文件在[/src/core/index.js](../src/core/index.js)。

第一行````import Vue from './instance/index'````应该就是定义Vue的地方了，打开[/src/core/instance/index.js](../src/core/instance/index.js)看一下。

## 010030
返回到[/src/core/index.js](../src/core/index.js)

看这一句。
````
initGlobalAPI(Vue)
````
它定义了Vue上的全局API，包括全局配置等，可在Vue文档中看到这些东西。

initGlobalAPI 详细介绍见[记录020-core-global-api.md](./记录020-core-global-api.md#020005)

## 010040-010
回到Vue类创建的地方[/src/core/instance/index.js](../src/core/instance/index.js)，看一下后面的第一句````initMixin(Vue)````。

initMixin方法定义的地方在 [/src/core/instance/init.js](../src/core/instance/init.js#145)。我们来分块看一下initMixin做了什么。

先看第一块(30行左右)，处理了options的一些继承关系。对于内部组件，直接使用父Vue类的东西。对于自定义组件，将动态合并父子options，并赋值到vm的$options属性上。

下面的是几个辅助函数
* initInternalComponent 初始化内部组件，直接使用父Vue类的选项
* resolveConstructorOptions 解析Vue类的options
  * 如果是Vue类，直接返回Vue类的options
  * 如果是Vue扩展类，则检查父类是否有变化
    * 如果有变化，则处理本身的options并将其返回
    * 如果没有变化，则返回原来的options
* resolveModifiedOptions 解析出变化的options，解析是通过比较当前options和sealedOptions(密封的Options)进行的

## 010040-020
继续看initMixin。
````
initLifecycle(vm)
````

initLifecycle在````src/core/instance/lifecycle.js````

````
/**
 * 初始化了内部生命周期相关属性
 * 挂载了$parent和$root
 */
export function initLifecycle (vm: Component) {
  const options = vm.$options

  // 定位第一个非abstract的父实例
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  // 挂载$parent和$root
  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  // 预先创建 $children 和 $refs
  vm.$children = []
  vm.$refs = {}

  // 预先创建内部属性
  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}
````

## 010040-030
继续看initMixin。
````
initEvents(vm)
````
initEvents在````src/core/instance/events.js````
````
/**
 * 初始化内部事件对象
 * 处理父作用域中注册的事件
 */
export function initEvents (vm: Component) {
  // 创建用于存储事件的对象
  vm._events = Object.create(null)
  // 钩子事件标识
  vm._hasHookEvent = false
  // 初始化在父作用域中的注册的listeners
  // _parentListeners就是在父组件模板中注册的listeners
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}
````

## 010040-040
继续看initMixin。
````
initRender(vm)
````
initEvents在````src/core/instance/render.js````
````
/**
 * 初始化一些渲染属性
 */
export function initRender (vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context

  // 初始化slot
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // 绑定createElement函数到实例上，这样我们能得到它内部的完整的渲染环境。
  // 参数顺序：tag, data, children, normalizationType,alwaysNormalize
  // 内部版本被模板编译出的渲染函数所使用。
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // 标准化对于公用版本是一直适用的，在用户定义的渲染函数中。
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs和$listeners被暴露出来用于更简单的高阶组件的创建。
  // 它们应该是响应式的，这样高阶组件就能使用它们来更新
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}
````

## 010040-050
继续看initMixin。
````
callHook(vm, 'beforeCreate')
````
调用了beforeCreate生命周期钩子。

看一下是如何调用的生命周期钩子。callHook也在````src/core/instance/lifecycle.js````。
````
/**
 * 调用生命周期钩子
 * @param hook 钩子名称
 */
export function callHook (vm: Component, hook: string) {
  // #7573 当调用生命周期钩子时暂停依赖收集
  pushTarget()
  // 调用生命周期钩子
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  // 触发钩子事件
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  popTarget()
}
````

## 010040-060
继续看initMixin。
````
initInjections(vm) // resolve injections before data/props
initState(vm)
initProvide(vm) // resolve provide after data/props
````
先看initInjections和initProvide。注意：provide 和 inject 绑定并不是可响应的。然而，如果你传入了一个可监听的对象，那么其对象的属性还是可响应的。

在````src/core/instance/inject.js````。
````
/**
 * 初始化provide
 */
export function initProvide (vm: Component) {
  const provide = vm.$options.provide
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide
  }
}

/**
 * 初始化injection
 */
export function initInjections (vm: Component) {
  // 这里解析inject。注意：在执行initProvide之前是解析不出inject的
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)    // 暂停observe
    // 将解析出的对象属性全定义成响应式属性
    // 也就是说：provide 和 inject 绑定并不是可响应的（因为上面暂停了observe）。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的属性还是可响应的。
    // 进一步解释，暂停了observe后，是无法创建observer的，但已经是observer的值就无所谓
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}

/**
 * 解析inject。它会向上搜索provide。
 * https://cn.vuejs.org/v2/api/#provide-inject
 * @param inject 这个inject是一个处理过的对象（与用户使用的inject格式不同），
 *     对象的 key 是本地的绑定名，value 是一个对象，该对象的：
 *         from 属性是在可用的注入内容中搜索用的 key (字符串或 Symbol)
 *         default 属性是降级情况下使用的 value它是一个对象
 * @result 解析出的对象。key是原来的key，value是解析出的value
 */
export function resolveInject (inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null)
    const keys = hasSymbol
      ? Reflect.ownKeys(inject)
      : Object.keys(inject)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // #6574 如果是observed，跳过（被observed的值有__ob__属性）
      if (key === '__ob__') continue
      // 向上搜索provide
      const provideKey = inject[key].from
      let source = vm
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey]
          break
        }
        source = source.$parent
      }
      // 如果没搜索到，使用默认值或给出警告
      if (!source) {
        if ('default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        } else if (process.env.NODE_ENV !== 'production') {
          warn(`Injection "${key}" not found`, vm)
        }
      }
    }
    return result
  }
}

````

## 010040-070
继续看initMixin。
````
initState(vm)
````
initState在````src/core/instance/state.js````。
````
/**
 * 初始化state
 * 处理了props/methods/data/computed/watch
 */
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
````
先看一下initData
````
/**
 * 在target上设置属性key，为target[sourceKey][key]的代理
 */
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
/**
 * 初始化vm的data
 * 它会处理data，在实例上设置data代理，并把data转换为observer
 */
function initData (vm: Component) {
  let data = vm.$options.data
  // 处理data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  //  检查非法
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // 判断methods与data重名
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    // 判断props与data重名
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {    // 检查保留字
      // 在实例上设置data的代理
      proxy(vm, `_data`, key)
    }
  }
  // 将data转换为observeer
  observe(data, true /* asRootData */)
}
````
其他的props/methods/computed/watch以后再看

## 010110
下面来看一下mountComponent函数。

它的作用是将vue实例挂载到dom。它在$mount中被调用，见#150210。

打开````src/core/instance/lifecycle.js````
````
/**
 * 将vue实例挂载到dom
 * 在$mount中被调用
 */
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    // 如果不存在render函数，则创建一个新的render函数
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // 调用beforeMount钩子
  callHook(vm, 'beforeMount')

  // 给watcher监听的函数。它会在数据更新时被调用。
  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      // 调用渲染函数生成 VNode
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      // _update 会执行挂载。其他细节 TODO
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // 划重点：这里就是创建watcher的地方
  // 在watcher的构造方法内部，设置watcher到vm._watcher上（isRenderWatcher设置为true）
  // 因为watcher的最初patch可能会调用$forceUpdate（例如，在子component的mounted钩子中），它依赖于vm._watcher被设置
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        // 触发beforeUpdate钩子
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // 手动挂载实例，调用自身的mound钩子
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
````






















