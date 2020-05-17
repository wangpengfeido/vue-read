## 030010
这一回说内部工具函数meergeOptions。

它的作用是合并两个options为一个新的options，在实例化和继承时都要用到。

打开````src/core/util/options.js````。
````
/**
 * 合并两个option对象为一个新的
 * 核心工具，在实例化和继承时使用
 */
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }

  // 当child是Vue类时，将其赋值为options
  if (typeof child === 'function') {
    child = child.options
  }

  // 统一格式
  normalizeProps(child, vm)
  normalizeInject(child, vm)
  normalizeDirectives(child)

  // 应用child的extends和mixins，
  // 但是只有它是一个原始的options对象而不是另一个mergeOptions结果时才会调用。这个判断是根据_base完成的。
  if (!child._base) {
    if (child.extends) {
      // 将child的extends选项合并进parent的options
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      // 将child的mixins选项合并进parent的options
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  // 合并
  // 过程是这样的：有一个strats数组，里面保存了不同key的合并逻辑
  // 如果在strats数组中存在对应key的合并逻辑则使用，否则使用默认合并逻辑
  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
````
## 030110
内部工具函数def。

它的作用是定义一个属性。实际上是Object.defineProperty的快捷调用方式，定义的属性enumerable默认为false并方便地更改。

打开````src/core/util/lang.js````。
````
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
````

## 030120
内部工具函数parsePath。

打开````src/core/util/lang.js````。
````
/**
 * 解析简单（类调用）路径
 * @return 除不符合规范情况外，返回一个函数，以某对象为参数调用此函数，返回路径下的值
 */
const bailRE = new RegExp(`[^${unicodeLetters}.$_\\d]`)
export function parsePath (path: string): any {
  // 如果不符合类调用路径则返回undefined
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
````

## 030130
内部工具函数isReserved。

打开````src/core/util/lang.js````。
````
/**
 * 检查一个字符串是否以 $ 或 _ 开始
 * 它可以用来检查某个属性是否是Vue的保留字
 */
export function isReserved (str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}
````

## 030210
这里介绍在````src/core/util/env.js````定义的环境常量。
### hasProto
环境中是否能使用__proto__。通过查看对象中是否有__proto__属性来实现。
````
export const hasProto = '__proto__' in {}
````

## 030310
mark。

在````src/core/util/perf.js````。该文件中的方法都是与window.performance相关的工具。
````
// 一个快捷调用window.performance.mark的方法
const perf = inBrowser && window.performance
mark = tag => perf.mark(tag)
````

## 030320
measure。

在````src/core/util/perf.js````。
````
const perf = inBrowser && window.performance
// 创建两个tag之间的performance.measure
measure = (name, startTag, endTag) => {
  perf.measure(name, startTag, endTag)
  perf.clearMarks(startTag)
  perf.clearMarks(endTag)
  perf.clearMeasures(name)
}
````

## 030410
classify。

在````src/core/util/debug.js````。
````
  /**
   * 将'-'/'_'连接命名字符串转换为大驼峰命名字符串
   */
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')
````

## 030420
formatComponentName。

在````src/core/util/debug.js````。
````
  /**
   * 得到vm实例的组件名。
   * @param includeFile 结果是否包含文件名
   * @return 带"<"">"，大驼峰格式。如"<MyComponent>"
   */
  formatComponentName = (vm, includeFile) => {
    // 如果是根实例，返回<Root>
    if (vm.$root === vm) {
      return '<Root>'
    }
    // 拿到options
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm
    // 拿到name
    let name = options.name || options._componentTag
    // 拿到文件名
    const file = options.__file
    // 如果name不存在并且文件名是.vue，那么以文件名作为name
    if (!name && file) {
      const match = file.match(/([^/\\]+)\.vue$/)
      name = match && match[1]
    }

    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }
````

## 035010
这回说工具函数extend。

打开````src/shared/util.js````，直接上源码
````
/**
 * 混入属性到目标对象中
 * 它执行的是一层浅复制
 */
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}
````

## 035020
工具函数remove。从数组中移除元素。

在````src/shared/util.js````。
````
/**
 * 从数组中移除元素
 */
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
````

## 035030
noop。

打开````src/shared/util.js````。
````
/**
 * 它代表没有操作
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
export function noop (a?: any, b?: any, c?: any) {}
````

## 035040
hasOwn。

打开````src/shared/util.js````。
````
/**
 * 检查对象中是否包含一个属性
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<*>, key: string): boolean {
  // 之所以要这样调用，是为了避免对象上有自定义的名为hasOwnProperty的属性。
  return hasOwnProperty.call(obj, key)
}
````

## 035050
isPlainObject。

打开````src/shared/util.js````。
````
/**
 * 严格对象类型检查。
 * 只有是plain object时才会返回true。
 */
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}
````

## 035060
isObject。

打开````src/shared/util.js````。
````
/**
 * 快速对象检查。
 * 它主要用于从JSON顺从的原始值中辨别对象
 */
export function isObject (obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object'
}
````

## 035070
makeMap。

打开````src/shared/util.js````。
````
/**
 * 生成一个map，并返回一个函数来检查一个key是否在map中
 * @param str 以逗号分隔的字符串
 * @param expectsLowerCase 是否转换为小写
 */
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}
````

## 035080
no。

打开````src/shared/util.js````。
````
/**
 * 一个永远返回false的函数
 */
export const no = (a?: any, b?: any, c?: any) => false
````

## 035090
isBuiltInTag。

打开````src/shared/util.js````。
````
/**
 * 检查一个标签是否是内置标签
 * 对于内置标签，它一定不是静态的
 */
export const isBuiltInTag = makeMap('slot,component', true)
````

## 035100
cached。

打开````src/shared/util.js````。
````
/**
 * 创建一个纯函数的缓存版本（仅适用于只有一个字符串参数的函数）
 * 返回的函数缓存版本，它会缓存每次调用的结果，当对这个函数传入相同参数时，直接返回曾经计算出的结果，而不会重新计算
 */
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}
````

## 035110
isDef。

打开````src/shared/util.js````。
````
/**
 * 判断某个变量是否非undefined并且非null
 */
export function isDef (v: any): boolean %checks {
  return v !== undefined && v !== null
}
````

## 035120
isPrimitive。

打开````src/shared/util.js````。
````
/**
 * 检查一个值是否是原生类型
 */
export function isPrimitive (value: any): boolean %checks {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}
````

## 035130
noop。

打开````src/shared/util.js````。
````
/**
 * 不执行任何操作
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
export function noop (a?: any, b?: any, c?: any) {}
````

## 035140
noop。

打开````src/shared/util.js````。
````
/**
 * 返回相同的值
 */
export const identity = (_: any) => _
````

## 035150
camelize。

打开````src/shared/util.js````。
````
/**
 * 将一个连字符分隔的字符串转换为驼峰字符串
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})
````

## 035160
capitalize。

打开````src/shared/util.js````。
````
/**
 * 大写字符串的第一个字母
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})
````






























