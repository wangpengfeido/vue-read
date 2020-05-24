## 150110 编译器/运行时
Vue 包含编译器和运行时。
* 完整版：同时包含编译器和运行时的版本。
* 编译器：用来将模板字符串编译成为 JavaScript 渲染函数的代码。
* 运行时：用来创建 Vue 实例、渲染并处理虚拟 DOM 等的代码。基本上就是除去编译器的其它一切。

当不使用模板时，可以只使用Vue的运行时版本。

下面是Vue完整版的渲染过程。
![](./_images/Vue$mount.png)

## 150210
$mount

$mount的实现。

先来看 运行时 版本。它执行了生命周期中的 mountComponent挂载实例。详情见 [记录010-core-instance.md](./记录010-core-instance.md#010110)。

打开[/src/platforms/web/runtime/index.js](../src/platforms/web/runtime/index.js)，40行左右定义了运行时版的 $mount 方法。


然后是 编译器+运行时 的完整版本。它解析 template/el 并转换成 render 函数，然后调用的运行时的$mount。

打开[/src/platforms/web/entry-runtime-with-compiler.js](../src/platforms/web/entry-runtime-with-compiler.js)，20行左右定义了 编译器+运行时 版的 $mount 方法。





















