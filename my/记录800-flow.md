# 800010
flow类型定义——ComponentOptions。

在````/flow/options.js````
````
declare type ComponentOptions = {
  componentId?: string;

  // data
  data: Object | Function | void;
  props?: { [key: string]: PropOptions };
  propsData?: ?Object;
  computed?: {
    [key: string]: Function | {
      get?: Function;
      set?: Function;
      cache?: boolean
    }
  };
  methods?: { [key: string]: Function };
  watch?: { [key: string]: Function | string };

  // DOM
  el?: string | Element;
  template?: string;
  render: (h: () => VNode) => VNode;
  renderError?: (h: () => VNode, err: Error) => VNode;
  staticRenderFns?: Array<() => VNode>;

  // 生命周期钩子。不知道为什么可能是数组
  beforeCreate?: Function;
  created?: Function;
  beforeMount?: Function;
  mounted?: Function;
  beforeUpdate?: Function;
  updated?: Function;
  activated?: Function;
  deactivated?: Function;
  beforeDestroy?: Function;
  destroyed?: Function;
  errorCaptured?: () => boolean | void;
  ssrPrefetch?: Function;

  // assets
  directives?: { [key: string]: Object };
  // Vue扩展类本身。这样可以允许本身递归引用。键名为扩展类的name
  components?: { [key: string]: Class<Component> };
  transitions?: { [key: string]: Object };
  filters?: { [key: string]: Function };

  // context
  provide?: { [key: string | Symbol]: any } | () => { [key: string | Symbol]: any };
  inject?: { [key: string]: InjectKey | { from?: InjectKey, default?: any }} | Array<string>;

  // component v-model customization
  model?: {
    prop?: string;
    event?: string;
  };

  // misc
  parent?: Component;
  mixins?: Array<Object>;
  name?: string;
  extends?: Class<Component> | Object;
  delimiters?: [string, string];
  comments?: boolean;
  inheritAttrs?: boolean;

  // private
  _isComponent?: true;
  _propKeys?: Array<string>;
  _parentVnode?: VNode;
  // 父组件模板中注册的listeners
  _parentListeners?: ?Object;
  _renderChildren?: ?Array<VNode>;
  _componentTag: ?string;
  _scopeId: ?string;
  // Vue类
  _base: Class<Component>;
};
````



## 800110
flow类型定义——Component。

在````/flow/component.js````
````
declare interface Component {
  // constructor information
  static cid: number;
  static options: Object;
  // extend
  static extend: (options: Object) => Function;
  static superOptions: Object;
  static extendOptions: Object;
  static sealedOptions: Object;
  static super: Class<Component>;
  // assets
  static directive: (id: string, def?: Function | Object) => Function | Object | void;
  static component: (id: string, def?: Class<Component> | Object) => Class<Component>;
  static filter: (id: string, def?: Function) => Function | void;
  // functional context constructor
  static FunctionalRenderContext: Function;

  // public properties
  $el: any; // so that we can attach __vue__ to it
  $data: Object;
  $props: Object;
  $options: ComponentOptions;
  $parent: Component | void;
  $root: Component;
  $children: Array<Component>;
  $refs: { [key: string]: Component | Element | Array<Component | Element> | void };
  $slots: { [key: string]: Array<VNode> };
  $scopedSlots: { [key: string]: () => VNodeChildren };
  $vnode: VNode; // the placeholder node for the component in parent's render tree
  $attrs: { [key: string] : string };
  $listeners: { [key: string]: Function | Array<Function> };
  $isServer: boolean;

  // public methods
  $mount: (el?: Element | string, hydrating?: boolean) => Component;
  $forceUpdate: () => void;
  $destroy: () => void;
  $set: <T>(target: Object | Array<T>, key: string | number, val: T) => T;
  $delete: <T>(target: Object | Array<T>, key: string | number) => void;
  $watch: (expOrFn: string | Function, cb: Function, options?: Object) => Function;
  $on: (event: string | Array<string>, fn: Function) => Component;
  $once: (event: string, fn: Function) => Component;
  $off: (event?: string | Array<string>, fn?: Function) => Component;
  $emit: (event: string, ...args: Array<mixed>) => Component;
  $nextTick: (fn: Function) => void | Promise<*>;
  // createElement 方法。可以创建vnode
  $createElement: (tag?: string | Component, data?: Object, children?: VNodeChildren) => VNode;

  // private properties
  _uid: number | string;
  _name: string; // this only exists in dev mode
  _isVue: true;
  _self: Component;
  // vm的proxy。主要用于渲染时属性找不到的报错。
  _renderProxy: Component;
  _renderContext: ?Component;
  // 渲染watcher
  _watcher: Watcher;
  // Vue实例上的watchers
  _watchers: Array<Watcher>;
  // 为计算属性创建的watchers
  _computedWatchers: { [key: string]: Watcher };
  // 处理后的data（函数处理为对象）
  _data: Object;
  _props: Object;
  // 用于存储事件
  _events: Object;
  _inactive: boolean | null;
  _directInactive: boolean;
  // 实例是否被挂载
  _isMounted: boolean;
  _isDestroyed: boolean;
  _isBeingDestroyed: boolean;
  _vnode: ?VNode; // self root node
  _staticTrees: ?Array<VNode>; // v-once cached trees
  // 是否拥有钩子事件。如果为true，将用$emit触发一个`hook:${hook名}`的事件
  _hasHookEvent: boolean;
  // 解析后的provide（函数处理为对象）
  _provided: ?Object;
  // _virtualComponents?: { [key: string]: Component };

  // private methods

  // lifecycle
  _init: Function;
  _mount: (el?: Element | void, hydrating?: boolean) => Component;
  _update: (vnode: VNode, hydrating?: boolean) => void;

  // 渲染函数。可以生成vm的VNode。它内部调用了options中的render。
  _render: () => VNode;

  __patch__: (
    a: Element | VNode | void,
    b: VNode,
    hydrating?: boolean,
    removeOnly?: boolean,
    parentElm?: any,
    refElm?: any
  ) => any;

  // createElement

  // _c 是内部的，接收`normalizationType`优化提示
  // 实际上就是createElement方法，多了一个normalizationType参数。（/core/vdom/create-element.js）
  _c: (
    vnode?: VNode,
    data?: VNodeData,
    children?: VNodeChildren,
    normalizationType?: number
  ) => VNode | void;

  // renderStatic 方法（/core/instance/render-helpers/render-static.js）
  _m: (index: number, isInFor?: boolean) => VNode | VNodeChildren;
  // markOnce
  _o: (vnode: VNode | Array<VNode>, index: number, key: string) => VNode | VNodeChildren;
  // toString 方法（/shared/util.js）
  _s: (value: mixed) => string;
  // createTextVnode 方法（/core/vdom/vnode.js）
  _v: (value: string | number) => VNode;
  // toNumber
  _n: (value: string) => number | string;
  // empty vnode
  _e: () => VNode;
  // loose equal
  _q: (a: mixed, b: mixed) => boolean;
  // loose indexOf
  _i: (arr: Array<mixed>, val: mixed) => number;
  // resolveFilter
  _f: (id: string) => Function;
  // renderList
  _l: (val: mixed, render: Function) => ?Array<VNode>;
  // renderSlot
  _t: (name: string, fallback: ?Array<VNode>, props: ?Object) => ?Array<VNode>;
  // apply v-bind object
  _b: (data: any, tag: string, value: any, asProp: boolean, isSync?: boolean) => VNodeData;
  // apply v-on object
  _g: (data: any, value: any) => VNodeData;
  // check custom keyCode
  _k: (eventKeyCode: number, key: string, builtInAlias?: number | Array<number>, eventKeyName?: string) => ?boolean;
  // resolve scoped slots
  _u: (scopedSlots: ScopedSlotsData, res?: Object) => { [key: string]: Function };

  // SSR specific
  _ssrNode: Function;
  _ssrList: Function;
  _ssrEscape: Function;
  _ssrAttr: Function;
  _ssrAttrs: Function;
  _ssrDOMProps: Function;
  _ssrClass: Function;
  _ssrStyle: Function;

  // allow dynamic method registration
  [key: string]: any
};
````

## 800210
AST。

模板转换成的AST语法树。

打开````/flow/compiler.js````
````
declare type ASTNode = ASTElement | ASTText | ASTExpression
````

## 800210-1
ASTElement
````
declare type ASTElement = {
  type: 1;
  tag: string;
  attrsList: Array<ASTAttr>;
  attrsMap: { [key: string]: any };
  rawAttrsMap: { [key: string]: ASTAttr };
  parent: ASTElement | void;
  children: Array<ASTNode>;

  start?: number;
  end?: number;

  processed?: true;

  // 此 AST 是否是静态节点
  static?: boolean;
  // 是否是静态根节点（真正编译时使用）
  staticRoot?: boolean;
  // 是否是v-for内的静态节点
  staticInFor?: boolean;
  // 该静态AST是否已被处理（编译）。它是一个标志，保证静态节点只被处理一次。
  staticProcessed?: boolean;
  // 是否有动态绑定
  hasBindings?: boolean;

  text?: string;
  attrs?: Array<ASTAttr>;
  props?: Array<ASTAttr>;
  plain?: boolean;
  // 是否有v-pre指令
  pre?: true;
  ns?: string;

  // 如果标签是一个组件，它的组件名
  component?: string;
  inlineTemplate?: true;
  transitionMode?: string | null;
  slotName?: ?string;
  slotTarget?: ?string;
  slotScope?: ?string;
  scopedSlots?: { [name: string]: ASTElement };

  ref?: string;
  refInFor?: boolean;

  // 是否有 v-if 指令
  if?: string;
  ifProcessed?: boolean;
  elseif?: string;
  else?: true;
  ifConditions?: ASTIfConditions;

  // 是否有 v-for 指令
  for?: string;
  forProcessed?: boolean;
  key?: string;
  alias?: string;
  iterator1?: string;
  iterator2?: string;

  staticClass?: string;
  classBinding?: string;
  staticStyle?: string;
  styleBinding?: string;
  events?: ASTElementHandlers;
  nativeEvents?: ASTElementHandlers;

  transition?: string | true;
  transitionOnAppear?: boolean;

  model?: {
    value: string;
    callback: string;
    expression: string;
  };

  directives?: Array<ASTDirective>;

  forbidden?: true;
  once?: true;
  onceProcessed?: boolean;
  wrapData?: (code: string) => string;
  wrapListeners?: (code: string) => string;

  // 2.4 ssr optimization
  ssrOptimizability?: number;

  // weex specific
  appendAsTree?: boolean;

  // 2.6 $slot check
  has$Slot?: boolean
};
````

## 800210-2
ASTExpression
````
declare type ASTExpression = {
  type: 2;
  expression: string;
  text: string;
  tokens: Array<string | Object>;
  static?: boolean;
  // 2.4 ssr optimization
  ssrOptimizability?: number;
  start?: number;
  end?: number;
  // 2.6 $slot check
  has$Slot?: boolean
};
````

## 800210-3
ASTText
````
declare type ASTText = {
  type: 3;
  text: string;
  static?: boolean;
  isComment?: boolean;
  // 2.4 ssr optimization
  ssrOptimizability?: number;
  start?: number;
  end?: number;
  // 2.6 $slot check
  has$Slot?: boolean
};
````

## 800310
VNode。

````
declare type VNodeChildren = Array<?VNode | string | VNodeChildren> | string;

declare type VNodeComponentOptions = {
  Ctor: Class<Component>;
  propsData: ?Object;
  listeners: ?Object;
  children: ?Array<VNode>;
  tag?: string;
};

declare type MountedComponentVNode = {
  context: Component;
  componentOptions: VNodeComponentOptions;
  componentInstance: Component;
  parent: VNode;
  data: VNodeData;
};

// interface for vnodes in update modules
declare type VNodeWithData = {
  tag: string;
  data: VNodeData;
  children: ?Array<VNode>;
  text: void;
  elm: any;
  ns: string | void;
  context: Component;
  key: string | number | void;
  parent?: VNodeWithData;
  componentOptions?: VNodeComponentOptions;
  componentInstance?: Component;
  isRootInsert: boolean;
};

declare interface VNodeData {
  // VNode的键
  key?: string | number;
  slot?: string;
  ref?: string;
  // 使用 ":is" 绑定的组件
  is?: string;
  pre?: boolean;
  tag?: string;
  staticClass?: string;
  class?: any;
  staticStyle?: { [key: string]: any };
  style?: Array<Object> | Object;
  normalizedStyle?: Object;
  props?: { [key: string]: any };
  attrs?: { [key: string]: string };
  domProps?: { [key: string]: any };
  hook?: { [key: string]: Function };
  on?: ?{ [key: string]: Function | Array<Function> };
  nativeOn?: { [key: string]: Function | Array<Function> };
  transition?: Object;
  show?: boolean; // marker for v-show
  inlineTemplate?: {
    render: Function;
    staticRenderFns: Array<Function>;
  };
  directives?: Array<VNodeDirective>;
  keepAlive?: boolean;
  scopedSlots?: { [key: string]: Function };
  model?: {
    value: any;
    callback: Function;
  };
};

declare type VNodeDirective = {
  name: string;
  rawName: string;
  value?: any;
  oldValue?: any;
  arg?: string;
  modifiers?: ASTModifiers;
  def?: Object;
};

declare type ScopedSlotsData = Array<{ key: string, fn: Function } | ScopedSlotsData>;

````














