好的，现在开始分析vue源码，分析过程就记录在这里。想来这个分析将是混乱的，不过没关系，慢慢来。

## 010010
想先试试能不能跑起来，先运行````yarn run dev````试了一下，发现竟然不行。多方查找发现是因为vue使用的*rollup-plugin-alias*插件对windows不友好，详情见[https://github.com/vuejs/vue/issues/2771](https://github.com/vuejs/vue/issues/2771)

## 010020
Vue的入口文件在[/src/core/index.js](../src/core/index.js)。

**重点**：VUE 入口

第一行````import Vue from './instance/index'````应该就是定义Vue的地方了，打开[/src/core/instance/index.js](../src/core/instance/index.js)看一下。

**重点**：定义VUE类

## 010030
返回到[/src/core/index.js](../src/core/index.js)

看这一句。
````
initGlobalAPI(Vue)
````
它定义了Vue上的全局API，包括全局配置等，可在Vue文档中看到这些东西。

initGlobalAPI 详细介绍见[记录020-core-global-api.md](./记录020-core-global-api.md#020005)

**重点**：定义 VUE 全局 API

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

initLifecycle在[/src/core/instance/lifecycle.js](../src/core/instance/lifecycle.js)，第40行左右

## 010040-030
继续看initMixin。
````
initEvents(vm)
````

initEvents在[/src/core/instance/events.js](../src/core/instance/events.js)，第20行左右

## 010040-040
继续看initMixin。
````
initRender(vm)
````
initEvents在[/src/core/instance/render.js](../src/core/instance/render.js)，第20行左右

## 010040-050
继续看initMixin。
````
callHook(vm, 'beforeCreate')
````
调用了beforeCreate生命周期钩子。

看一下是如何调用的生命周期钩子。callHook也在[/src/core/instance/lifecycle.js](../src/core/instance/lifecycle.js)，第370行左右。

## 010040-060
继续看initMixin。
````
initInjections(vm) // resolve injections before data/props
initState(vm)
initProvide(vm) // resolve provide after data/props
````

先看initInjections和initProvide。注意：provide 和 inject 绑定并不是可响应的。然而，如果你传入了一个可监听的对象，那么其对象的属性还是可响应的。

在[/src/core/instance/inject.js](../src/core/instance/inject.js)，第7行左右。

## 010040-070
继续看initMixin。
````
initState(vm)
````

initState在[/src/core/instance/state.js](../src/core/instance/state.js)，第50行左右。

先看一下initData，第120行左右

其他的props/methods/computed/watch以后再看

## 010110
下面来看一下mountComponent函数。

它的作用是将vue实例挂载到dom。它在$mount中被调用，见[#150210](./记录150-platforms.md#150210)。

打开[/src/core/instance/lifecycle.js](../src/core/instance/lifecycle.js)，第150行左右。

**重点**：这个方法内部创建了watcher























