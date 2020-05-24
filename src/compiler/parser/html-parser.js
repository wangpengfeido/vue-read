/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson (MPL-1.1 OR Apache-2.0 OR GPL-2.0-or-later)
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

import { makeMap, no } from 'shared/util'
import { isNonPhrasingTag } from 'web/compiler/util'
import { unicodeRegExp } from 'core/util/lang'

// 用于解析标签和属性的正则表达式
// 匹配属性部分，捕获属性名,"=",以双引号包含的属性值,以单引号包含的属性值,不带引号的属性值
// Regular Expressions for parsing tags and attributes
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`
// qname。一开始对这个冒号表示奇怪，经查询后冒号及前面的名字是xml中表示命名空间的。
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
// 匹配起始标签的开头，捕获标签名（不包括命名空间）。例如："<div"
const startTagOpen = new RegExp(`^<${qnameCapture}`)
// 匹配起始标签的结束，捕获'/'如果存在的话。例如：" >","/>"
const startTagClose = /^\s*(\/?)>/
// 匹配结束标签。例如："</div>"
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const doctype = /^<!DOCTYPE [^>]+>/i
// 匹配注释
// #7298: escape - to avoid being passed as HTML comment when inlined in page
const comment = /^<!\--/
// 匹配条件注释
const conditionalComment = /^<!\[/

// Special Elements (can contain anything)
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
}
const encodedAttr = /&(?:lt|gt|quot|amp|#39);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g

// #5992
// 判断对应tag和html是否忽略首个空行。html一般是处理完tag后剩下的html
// 如果tag是pre/textarea，并且其内容html首行是空行，那么返回ture
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'

/**
 * 解码属性值。即将html转义字符解码成原字符
 * @param value 属性值
 * @param shouldDecodeNewlines 是否解码 换行符 和 制表符。
 * @return {*|void|string} 解码后的字符串
 */
function decodeAttr (value, shouldDecodeNewlines) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, match => decodingMap[match])
}


/**
 * @param html
 * @param options
 *     isUnaryTag {Function}     一个函数，接受一个标签名，返回这个标签是否是自闭标签
 *     shouldDecodeNewlinesForHref {Boolean}    a 标签和 href 属性解码属性值时是否解码换行
 *     shouldDecodeNewlines {Boolean}    除 a 标签和 href 属性外，解码属性值时是否解码换行
 *     start {Function}       一个回调函数，在每个开始标签解析完成后调用。参数：标签名，属性数组，是否自闭，开始位置，结束位置
 */
export function parseHTML (html, options) {
  // 记录已解析的非自闭开始标签，在与结束标签匹配时使用。   {tag: 标签名, lowerCasedTag: 小写标签名, attrs: 属性数组, start: 开始位置, end: 结束位置}
  const stack = []
  const expectHTML = options.expectHTML
  const isUnaryTag = options.isUnaryTag || no
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  // 当前已解析到的位置。随着解析的进行，解析位置会增长，html也会随之被截取
  let index = 0
  // last是上次解析开始时的html。lastTag时上次解析的标签名。（这里的一次解析指下面的一次循环）
  let last, lastTag
  while (html) {
    // 保留html副本
    last = html
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // 如果没有lastTag
      // 或者确保lastTag不是一个plaintext content element，像 script/style/textarea

      let textEnd = html.indexOf('<')
      if (textEnd === 0) {
        // 如果 "<" 在开头

        // Comment:
        if (comment.test(html)) {
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3)
            }
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          const conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index
          advance(endTagMatch[0].length)
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // 开始标签:
        // Start tag:
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
          handleStartTag(startTagMatch)
          // 在某些情况下忽略内容首行空行
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1)
          }
          continue
        }
      }

      let text, rest, next
      if (textEnd >= 0) {
        rest = html.slice(textEnd)
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        }
        text = html.substring(0, textEnd)
      }

      if (textEnd < 0) {
        text = html
      }

      if (text) {
        advance(text.length)
      }

      if (options.chars && text) {
        options.chars(text, index - text.length, index)
      }
    } else {
      let endTagLength = 0
      const stackedTag = lastTag.toLowerCase()
      const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    if (html === last) {
      options.chars && options.chars(html)
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`, { start: index + html.length })
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag()

  // 解析到的位置增加n，并将解析完的html截掉
  function advance (n) {
    index += n
    html = html.substring(n)
  }

  /**
   * 解析开始标签
   * @return {{tagName,attrs,start,end,unarySlash}}    解析出的信息
   */
  function parseStartTag () {
    // 解析出开始标签的开头
    const start = html.match(startTagOpen)
    if (start) {
      // 确保它存在开始标签

      const match = {
        // 标签名
        tagName: start[1],
        // 属性名数组   数组元素为{match,start:属性开始位置,end:属性结束位置}
        attrs: [],
        // 标签起点在html中的位置
        start: index
      }
      // 解析位置增加，表示标签开头已解析完
      advance(start[0].length)
      let end, attr
      // 没有到开始标签的结尾，并且可以继续解析出属性
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        // 解析位置增加，表示该属性已解析完
        attr.start = index
        advance(attr[0].length)
        attr.end = index
        // 存储属性
        match.attrs.push(attr)
      }
      // 如果到了开始标签的结尾
      if (end) {
        // 表示该标签是否是一个自闭标签。如果是这个值是"/"
        match.unarySlash = end[1]
        // 解析位置增加，表示标签结尾已解析完
        advance(end[0].length)
        // 标签终点在html中的位置
        match.end = index
        // 返回解析出的信息
        return match
      }
    }
  }

  /**
   * 处理开始标签
   * @param match parseStartTag函数返回的标签信息
   */
  function handleStartTag (match) {
    const tagName = match.tagName
    const unarySlash = match.unarySlash

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    const unary = isUnaryTag(tagName) || !!unarySlash

     // 属性数组的长度
    const l = match.attrs.length
    // 构建一个和属性数组长度相同的数组
    const attrs = new Array(l)
    // 循环处理属性
    for (let i = 0; i < l; i++) {
      // 属性
      const args = match.attrs[i]
      // 属性值。（参考属性匹配正则）
      const value = args[3] || args[4] || args[5] || ''
      // 如果是a标签或href属性，解码属性值时需要分开处理
      const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
      // 解析后的属性相关
      attrs[i] = {
        // 属性名
        name: args[1],
        // 解码后的属性值
        value: decodeAttr(value, shouldDecodeNewlines)
      }
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length
        attrs[i].end = args.end
      }
    }

    // 如果不是自闭标签
    if (!unary) {
      // 存入stack。stack在与结束标签匹配时使用
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end })
      // lastTag赋值
      lastTag = tagName
    }

    // 调用start回调
    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index

    // Find the closest opened tag of the same type
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`,
            { start: stack[i].start, end: stack[i].end }
          )
        }
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
