## 020005
打开[/src/core/global-api/index.js](../src/core/global-api/index.js)。

initGlobalAPI 函数定义了Vue上的全局API，包括全局配置等，可在Vue文档中看到这些东西。

**重点**：定义 VUE 全局 API

## 020010
这一部分说全局API Vue.extend 的实现。

在 initGlobalAPI 中调用了 initExend 方法，见[020005](#020005)。

打开[/src/core/global-api/extend.js](../src/core/global-api/extend.js)文件，initExtend方法就在里面。

在这个方法当中，不仅实现了传统的类继承，并实现了Vue特有的一些继承和操作，包括options合并等

**重点**：Vue.extend 实现




