/* @flow */

import config from "../config";
import { initProxy } from "./proxy";
import { initState } from "./state";
import { initRender } from "./render";
import { initEvents } from "./events";
import { mark, measure } from "../util/perf";
import { initLifecycle, callHook } from "./lifecycle";
import { initProvide, initInjections } from "./inject";
import { extend, mergeOptions, formatComponentName } from "../util/index";

let uid = 0;

export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark(startTag);
    }

    // 处理了options的一些继承关系。对于内部组件，直接使用父Vue类的东西。对于自定义组件，将动态合并父子options，并赋值到vm的$options属性上。

    // a flag to avoid this being observed
    vm._isVue = true;
    // 合并 options
    // TODO:wpf _isComponent
    if (options && options._isComponent) {
      // 优化内部组件实例
      // 因为动态 option 合并很慢，并且没有内部组件需要特别对待
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      // 这里是动态option合并
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, "beforeCreate");
    initInjections(vm); // resolve injections before data/props
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, "created");

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(`vue ${vm._name} init`, startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

/**
 * 初始化内部组件
 * 直接使用父Vue类的选项
 */
export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create(vm.constructor.options));
  // 这样做的原因是它比动态枚举快
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  const vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

/**
 * 解析Vue类的options
 * 如果是Vue类，直接返回Vue类的options
 * 如果是Vue扩展类，则检查父类是否有变化
 *     如果有变化，则处理本身的options并将其返回
 *     如果没有变化，则返回原来的options
 * @return {*} 解析出的options
 */
export function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options;
  // 判断是否具有父类，即是否是Vue扩展类
  // 因为Vue扩展类上有super属性为其父类的引用，具体看020010
  if (Ctor.super) {
    // 递归处理其父类options
    const superOptions = resolveConstructorOptions(Ctor.super);
    const cachedSuperOptions = Ctor.superOptions;
    // 检查父类options是否有变化
    // 如果有变化，则处理这些options
    if (superOptions !== cachedSuperOptions) {
      // 将新的父类options赋给superOptions属性。
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // 检查本身options是否有变化
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // 如果有变化则更新到扩展的options(extendOptions)上去
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      // 下面这两步操作在Vue.extend方法中也有做，见#020010
      // 合并父类options与扩展的options
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      // 允许自身递归查找
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options;
}

/**
 * 解析出变化的options
 * 解析是通过比较当前options和sealedOptions(密封的Options)进行的
 * @param Ctor Vue扩展类
 * @return {*} 如果有变化返回变化的options，否则返回undefined
 */
function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
  let modified;
  const latest = Ctor.options;
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {};
      modified[key] = latest[key];
    }
  }
  return modified;
}
