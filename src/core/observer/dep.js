/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * dep 是可观察的，有多个指令订阅了它
 */
/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher; // 看下面的定义
  id: number;              // dep的id
  subs: Array<Watcher>;    // 订阅者列表

  constructor () {
    this.id = uid++
    this.subs = []
  }

  // 添加订阅者
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  // 移除订阅者
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  // 将当前正在求值的watcher与该dep绑定（watcher添加到dep的订阅者列表，dep添加到watcher的依赖列表）
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知。即告诉其订阅者数据更新。
  notify () {
    // 稳定订阅者列表（浅拷贝）
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // 如果没有异步运行，subs并非按时间表排序。
      // 我们需要将其排序以保证它们会被以正确的顺序触发
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// 当前正在求值的目标watcher。
// 这个是全局唯一的，因为在一个时刻只能有一个watcher被求值。
// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

// 将watcher推入栈，并设置为正在求值的watcher
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

// 将watcher出栈，并将栈首watcher设置为正在求值的watcher
export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
