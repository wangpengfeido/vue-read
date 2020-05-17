/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // 创建Vue的全局配置（Vue.config）
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // util方法
  // 注意：这些并不是公开的API
  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 定义了 set/delete/nextTick 三个全局API
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 新增的 observable 全局API
  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  // 创建默认的 options，包括 components/directives/filters
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // TODO: wpf
  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  // 创建内置组件
  // 实际上就是在 components 的 options 中定义注册了这些组件
  extend(Vue.options.components, builtInComponents)

  // 定义 use/mixin/extend 等全局API
  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  // 定义资源注册API，如component/directive/filter等
  initAssetRegisters(Vue)
}
