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

先来看运行时版本。它执行了生命周期中的 mountComponent挂载实例。详情见 #010110。

打开````src/platforms/web/runtime/index.js````。
````
// 公共的 $mount 方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  // 执行挂载
  return mountComponent(this, el, hydrating)
}
````

然后是编译器+运行时的完整版本。它解析 template/el 并转换成 render 函数，然后调用的运行时的$mount。

打开````src/platforms/web/runtime/entry-runtime-with-compiler.js````
````
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  if (!options.render) {
    // 如果没有自定义的 render 函数，则解析 template/el 并转换成 render 函数
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        // 当template是一个字符串，并以"#"开头时，使用匹配元素的 innerHTML 作为模板
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        // 如果是一个 Element ，使用它的 innerHTML 作为 template
        template = template.innerHTML
      } else {
        // template 类型不对，报错
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 如果没有 template 获取外部的 html
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // 将 template 编译为 render 函数
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 调用运行时版本的$mount。
  return mount.call(this, el, hydrating)
}
````






















