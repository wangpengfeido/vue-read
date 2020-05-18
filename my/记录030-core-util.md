## 030010
这一回说内部工具函数meergeOptions。

它的作用是合并两个options为一个新的options，在实例化和继承时都要用到。

打开[/src/core/util/options.js](../src/core/util/options.js)，第400行左右。

## 030110
内部工具函数def。

它的作用是定义一个属性。实际上是Object.defineProperty的快捷调用方式，定义的属性enumerable默认为false并方便地更改。

打开[/src/core/util/lang.js](../src/core/util/lang.js)，第20行左右。

## 030120
内部工具函数parsePath。

解析简单（类调用）路径

打开[/src/core/util/lang.js](../src/core/util/lang.js)，第40行左右。

## 030130
内部工具函数isReserved。

检查一个字符串是否以 $ 或 _ 开始

打开[/src/core/util/lang.js](../src/core/util/lang.js)，第10行左右。

## 030210
[/src/core/util/env.js](../src/core/util/env.js)定义了环境常量。

### hasProto
环境中是否能使用__proto__。通过查看对象中是否有__proto__属性来实现。

## 030310
mark。

一个快捷调用window.performance.mark的方法

在[/src/core/util/perf.js](../src/core/util/perf.js)。该文件中的方法都是与window.performance相关的工具。

## 030320
measure。

创建两个tag之间的performance.measure

在[/src/core/util/perf.js](../src/core/util/perf.js)。

## 030410
classify。

将'-'/'_'连接命名字符串转换为大驼峰命名字符串

在[/src/core/util/debug.js](../src/core/util/debug.js)，第20行左右。

## 030420
formatComponentName。

得到vm实例的组件名。

在[/src/core/util/debug.js](../src/core/util/debug.js)，第40行左右。

## 035010
这回说工具函数extend。

混入属性到目标对象中，它执行的是一层浅复制

打开[/src/shared/util.js](../src/shared/util.js)，第240行左右。

## 035020
工具函数remove。

从数组中移除元素。

打开[/src/shared/util.js](../src/shared/util.js)，第150行左右。

## 035030
noop。

它代表没有操作

打开[/src/shared/util.js](../src/shared/util.js)，第280行左右。

## 035040
hasOwn。

检查对象中是否包含一个属性

打开[/src/shared/util.js](../src/shared/util.js)，第160行左右。

## 035050
isPlainObject。

严格对象类型检查，只有是plain object时才会返回true。

打开[/src/shared/util.js](../src/shared/util.js)，第70行左右。

## 035060
isObject。

快速对象检查，它主要用于从JSON顺从的原始值中辨别对象

打开[/src/shared/util.js](../src/shared/util.js)，第50行左右。

## 035070
makeMap。

生成一个map，并返回一个函数来检查一个key是否在map中

打开[/src/shared/util.js](../src/shared/util.js)，第120行左右。

## 035080
no。

一个永远返回false的函数

打开[/src/shared/util.js](../src/shared/util.js)，第300行左右。

## 035090
isBuiltInTag。

检查一个标签是否是内置标签。对于内置标签，它一定不是静态的。

打开[/src/shared/util.js](../src/shared/util.js)，第140行左右。

## 035100
cached。

创建一个纯函数的缓存版本（仅适用于只有一个字符串参数的函数）

打开[/src/shared/util.js](../src/shared/util.js)，第190行左右。

## 035110
isDef。

判断某个变量是否非undefined并且非null

打开[/src/shared/util.js](../src/shared/util.js)，第20行左右。

## 035120
isPrimitive。

检查一个值是否是原生类型

打开[/src/shared/util.js](../src/shared/util.js)，第30行左右。

## 035140
identity

返回相同的值

打开[/src/shared/util.js](../src/shared/util.js)，第330行左右。

## 035150
camelize。

将一个连字符分隔的字符串转换为驼峰字符串

打开[/src/shared/util.js](../src/shared/util.js)，第200行左右。

## 035160
capitalize。

大写字符串的第一个字母

打开[/src/shared/util.js](../src/shared/util.js)，第220行左右。






























