/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * watcher 分析表达式，收集依赖，当表达式值变化时触发回调。
 * 它被用在 $watch api 和 指令
 */
/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  // Vue实例
  vm: Component;
  // 表达式
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  // 选项。关于lazy选项，它是用于computed。
  // 如果它为true，那么数据更新时不会立刻计算值（创建watcher时也不会计算），而是调用evaluate方法时才计算
  // 这样就实现了：只有在获取computed属性的值时才计算一次
  lazy: boolean;
  sync: boolean;
  // 配合lazy使用。是否数据变化了，但是并未求值
  dirty: boolean;
  active: boolean;
  // watcher订阅的deps
  deps: Array<Dep>;
  // 收集依赖的中转。在watcher触发getter后的收集依赖中，订阅被存放在newDeps中，完成后再转移到deps中
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  // options中的一个函数，在watcher被触发update时首先调用
  before: ?Function;
  // getter-获取表达式值的方法
  getter: Function;
  // 计算出的表达式的值
  value: any;

  constructor (
    vm: Component,
    // 表达式
    expOrFn: string | Function,
    // 回调函数。触发更新时执行
    cb: Function,
    options?: ?Object,
     // 是否是渲染用watcher。即watcher对应的vm是否被渲染。如果它为true，将会把该watcher赋给vm._watcher
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    // 如果是渲染用watcher，把该watcher赋给vm._watcher
    if (isRenderWatcher) {
      vm._watcher = this
    }
    // 当前Watcher添加到vue实例上
    vm._watchers.push(this)
    // options 配置
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // 将表达式转换为(getter)函数
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      // 当表达式不合法（不能转换为getter），将getter设置为空操作
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    // 获取到表达式的值，它会触发一次依赖收集
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * 求 getter函数 的值，重新收集依赖
   * @return 计算出的值
   */
  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    // 将watcher入栈并设置为当前求值watcher
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 计算值
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      // 求值完成，watcher出栈，不再是当前watcher
      popTarget()
      // 清理deps
      this.cleanupDeps()
    }
    return value
  }

  /**
   * 为指令添加一个dep
   * 即使使该watcher订阅一个dep
   */
  /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * 收集依赖后的清理。主要是将new deps转移到deps中
   */
  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * 订阅接口。
   * 当依赖改变时被调用。
   * 即 dep 会通过它通知 watcher 数据更新。
   */
  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * 调度工作接口。
   * 被调度器调用。
   * 它会重新计算value值，并调用回调函数
   */
  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
