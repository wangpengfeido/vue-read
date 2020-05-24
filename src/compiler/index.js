/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// createCompilerCreator 容许使用可选择的 parser/optimizer/codegen 创建编译器。例如，SSR最佳的编译器
// 这里我们只使用默认的部分，导出一个默认的编译器。
// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 模板生成 ast
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    // ast 优化。标记出静态根节点
    optimize(ast, options)
  }
  // ast 编译为render代码
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
