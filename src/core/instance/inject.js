/* @flow */

import { hasOwn } from 'shared/util'
import { warn, hasSymbol } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'

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
    toggleObserving(false)
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
      // #6574 in case the inject object is observed...
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
