/* @flow */

import { makeMap, isBuiltInTag, cached, no } from 'shared/util'

// 一个可以判断 key 是否是 static key 的函数
// static key 的解释：如果一个ASTElement的属性，除了固有属性外全部都是static key，那么这个ASTElement就是静态的
let isStaticKey
// 一个用来检查标签是否是保留标签的函数
// 保留标签：如果一个标签不是保留标签，那么它就是一个Vue中定义的组件标签
let isPlatformReservedTag

const genStaticKeysCached = cached(genStaticKeys)

/**
 * 优化器的目标：遍历生成的模板AST树，探测完全静态的子树。例如，DOM中从来不需要变化的部分
 * 我们探测到这些子树后，我们就能：
 *     1.把他们变为常量，那样我们就不再需要在每次重新渲染时为它们创建新的nodes
 *     2.在 patch 过程中完全跳过它们
 * @param root
 * @param options
 *     staticKeys    指定的 static keys 列表
 *     isReservedTag    一个用来检查标签是否是保留标签的函数
 */
/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */
export function optimize (root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  isStaticKey = genStaticKeysCached(options.staticKeys || '')
  isPlatformReservedTag = options.isReservedTag || no
   // 第一步：标记所有静态节点
  // first pass: mark all non-static nodes.
  markStatic(root)
  // 第二步：标记静态根节点
  // second pass: mark static roots.
  markStaticRoots(root, false)
  // 其实真正有用的是静态根节点，标记静态节点也只是为了找出静态根节点。后面编译用到的是静态根节点。
}

/**
 * 生成一个判断函数，这个函数可以判断一个key是否是static key。
 * @param keys 指定的 static keys 列表。
 */
function genStaticKeys (keys: string): Function {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

/**
 * 遍历子节点，找出所有静态节点，并标记
 */
function markStatic (node: ASTNode) {
  node.static = isStatic(node)
  if (node.type === 1) {
    // 组件slot的内容不作为静态。这避免：
    // 1.组件不能改变slot节点；
    // 2.静态slot内容不能用于热重载
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      // 满足上面的条件则说明该标签的内容是作为被插槽插入的内容
      // 此时中止遍历，其内容不作为静态
      return
    }
    // 深度优先遍历
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      // 如果子节点中有非静态节点，那么父节点就不是静态节点
      if (!child.static) {
        node.static = false
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block
        markStatic(block)
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

/**
 * 检查并标记某个AST节点是否是静态根节点
 */
function markStaticRoots (node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    // 标记在v-for内的静态节点
    if (node.static || node.once) {
      node.staticInFor = isInFor
    }
    // 如果一个节点有资格成为一个静态根节点，它的子节点不能只是一个静态文本节点。
    // 否则把它提出来的花费大于收益，并且更好的是永远重新渲染它
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      // 如果一个元素节点是静态节点，并且它有子节点，并且它的子节点不是一个文本节点，那么它就是一个静态根节点
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    // 递归判断其子节点
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

/**
 * 检查并标记某个AST节点是否是静态节点
 */
function isStatic (node: ASTNode): boolean {
  // 表达式不可能是静态的
  if (node.type === 2) { // expression
    return false
  }
  // 文本一定是静态的
  if (node.type === 3) { // text
    return true
  }
  return !!(node.pre /* 有v-pre指令 */ || (
    !node.hasBindings && // no dynamic bindings // 没有动态绑定
    !node.if && !node.for && // not v-if or v-for or v-else // 没有 v-if 与 v-for 与 v-else
    !isBuiltInTag(node.tag) && // not a built-in // 不是内置标签(solt,component)
    isPlatformReservedTag(node.tag) && // not a component // 不是 component （是平台保留标签）
    !isDirectChildOfTemplateFor(node) && // 不是带有v-for指令的template标签节点的子节点
    Object.keys(node).every(isStaticKey) // 除了固有key外，全部都是static key
  ))
}

/**
 * 检查一个 ASTElement 节点是否是 带有v-for指令的template标签节点 的子节点
 */
function isDirectChildOfTemplateFor (node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}
