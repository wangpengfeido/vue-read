/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

// 在组件的更新计算中，某些情况，我们可能想要禁用 observation
/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}


/**
 * 观察者类，附加到每个被观察的对象上
 * 一旦附加上，观察者转换目标对象的属性为getter/setters，用来收集依赖和分发更新
 */
/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  // {{{拥有这个对象}作为根$data的}vms的}数量
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this) // 在对象上定义__ob__为本observer
    if (Array.isArray(value)) {
      // 当是数组

      // 这里的arrayMethods是拷贝的Array的prototype
      // 下面这几句的作用是使数组拥有数组方法，但是数组本身就具有数组方法，为什么要这样做还有待探究，可能是为了兼容
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }

      this.observeArray(value)
    } else {
      // 当是对象（当然，也有可能是非数组的其他类型，但是walk方法会忽略）

      this.walk(value)
    }
  }

  /**
   * 遍历所有的属性并将其转换为响应式属性（getter/setters）。
   * 这个方法应该只有当值是Object时被调用。
   */
  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * 观察一个数组
   * 直接循环观察其子属性
   * 因为不能创建数组子元素的存取值器
   * 这决定了数组不会监听其子属性的值变化
   */
  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * 使用通过__proto__拦截原型链的方式，来增强目标对象或数组
 * 即将额外对象赋值为目标对象的原型链
 */
/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * 通过定义隐藏的(enumerable===false)属性，来增强目标或数组
 * 即将额外属性赋值到目标对象上，并且附加的属性带有 enumerable=false
 * @param target 需要增强的对象
 * @param src key-value hash对
 * @param keys key列表
 */
/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * 尝试为一个值创建observer实例。
 * 如果成功返回observer；如果值已经是observer则返回已经存在的observer。
 * @return {Observer|void}
 */
/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    // 如果不是对象或对象继承自VNode，则返回。
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 如果此值已经创建了observer，则结果是这个observer。
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) && // 保证是数组或对象
    Object.isExtensible(value) &&                     // 保证extensible
    !value._isVue                                     // 保证非Vue类及扩展类
  ) {
    // 为该值创建新的observer实例
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    // 如果这个observer是作为根$data的，那么计数器+1
    ob.vmCount++
  }
  return ob
}

/**
 * 定义一个对象上的一个响应式属性。
 * 即定义getter/setter。watcher触发getter重新收集dep的订阅者，触发setter通知变化
 * @param val 该属性的默认值。并且val也负责了存储该属性值的任务
 * @param customSetter 一个回调函数，在setter触发时执行
 * @param shallow 如果不为true，则转换其属性值的子属性定义为observer;如果为true，则只转换当前属性，不转换子属性
 */
/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 该属性对应的dep
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 如果属性为非configurable，则跳过
  if (property && property.configurable === false) {
    return
  }

  // 迎合预先定义的 getter/setters
  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    // 为val赋默认值
    val = obj[key]
  }

  // 递归把该属性值转换为observer
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    // 当触发getter
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // 如果是watcher触发的getter，那么重新收集dep的订阅者
      // （Dep.target代表当前watcher，如果存在该值那么说明是当前watcher触发的）
      if (Dep.target) {
        // 重新收集dep的订阅者
        // 既然getter是当前watcher触发的，那么就将当前watcher和该属性对应的dep绑定
        dep.depend()
        if (childOb) {
          // 重新收集该值对应的子observer对应的dep的订阅者
          childOb.dep.depend()
          // 如果值是数组，递归收集依赖
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    // 当触发setter
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 当value未变化或为非法值，直接返回
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      // 如果存在customSetter则执行
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      // 设置属性值。
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 把新设置的属性转换为observer
      childOb = !shallow && observe(newVal)
      // 触发dep.notify。通知值变化。
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * 收集数组元素的依赖。
 * 因为我们不能用getter的方式拦截数组元素。
 */
/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  // 遍历数组，如果元素不是数组，则为其收集依赖；如果是数组，则递归子元素
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
