class Wue {
  constructor(options) {
    const vm = this;

    // 构建$options参数
    vm.$options = options;

    // 对data进行数据劫持
    let data = vm._data = vm.$options.data;
    observe(vm._data);

    // 设置代理
    for (let key in vm._data) {
      proxy(vm, '_data', key);
    }

    callHook(vm, 'created');
    new Compiler(vm.$options.el, vm);
    callHook(vm, 'mounted');
  }

  // $watch
  $watch(key, cb) {
    new Watcher(this, key, cb);
  }
}


// 设置代理
function proxy(target, sourceKey, key) {
  Object.defineProperty(target, key, {
    get: function proxyGetter() {
      return target[sourceKey][key];
    },
    set: function proxySetter(newVal) {
      return target[sourceKey][key] = newVal;
    },
  });
}


// 调用钩子
function callHook(vm, hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    handlers.call(vm);
  }
}


// observer实现
function observe(value) {
  // 如果不是对象直接return
  if (!value || typeof value !== 'object') {
    return;
  }
  return new Observer(value);
}

class Observer {
  constructor(value) {
    this.walk(value);
  }

  walk(obj) {
    Object.keys(obj).forEach((key) => {
      defineReactive(obj, key, obj[key]);
    })
  }
}

function defineReactive(obj, key, value) {
  const dep = new Dep();

  // 当属性是对象，对其observe
  observe(obj[key]);
  Object.defineProperty(obj, key, {
    get() {
      // 收集依赖
      if (Dep.target) {
        Dep.target.addDep(dep);
      }
      return value;
    },
    set(newVal) {
      if (newVal === value) {
        return;
      }
      value = newVal;
      // 当新设置属性是对象，重新对其observe
      observe(newVal);
      // 通知更新
      dep.notify();
    },
  })
}


// dep 实现
class Dep {
  constructor() {
    this.sub = [];
  }

  addSub(sub) {
    this.sub.push(sub);
  }

  notify() {
    for (let sub of this.sub) {
      sub.update();
    }
  }
}

// 当前正在计算值的 watcher
Dep.target = null;
targetStack = [];

function pushTarget(target) {
  targetStack.push(target);
  Dep.target = target;
}

function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}


// watcher 实现
class Watcher {
  constructor(vm, expression, cb) {
    this.vm = vm;
    this.expression = expression;
    this.cb = cb;
    this.value = this.getVal();
  }

  getVal() {
    console.log('///')
    // 将本 watcher 设置为正在计算值的watcher
    pushTarget(this);

    // 计算值。这里会触发 observer 的get方法，从而收集依赖
    let val = this.vm;
    this.expression.split('.').forEach((key) => {
      val = val[key];
    });

    popTarget();
    return val;
  }

  addDep(dep) {
    dep.addSub(this);
  }

  // 被通知数据更新的接口
  update() {
    // const oldValue = this.value;
    // let val = this.getVal();
    // // 更新值
    // this.value = val;
    // // 调用回调
    // this.cb.call(this.vm, val, this.value, oldValue);
    // 之所以不采用上面这种写法，是因为 this.getVal() 会触发相应式属性的get收集依赖
    // 然后可以追溯到Watcher的appDep方法，和Dep的addSub方法，但这个收集依赖存在问题即没有判断重复收集依赖
    // 所以触发本update的Dep的notify方法中被循环的subs数组会不断增大，所以变成了一个死循环

    let val = this.vm;
    this.expression.split('.').forEach((key) => {
      val = val[key]
    });
    this.cb.call(this.vm, val, this.value);
    this.value = val;
  }
}


// compiler实现
// 它实现了一个简单的数据与视图的双向绑定
class Compiler {
  constructor(el, vm) {
    vm.$el = document.querySelector(el);
    this.replace(vm.$el, vm);
  }

  replace(frag, vm) {
    Array.from(frag.childNodes).forEach(node => {
      let txt = node.textContent;
      // 正则匹配 {{}}
      let reg = /\{\{(.*?)\}\}/;
      // 如果是包含 {{}} 的文本节点，则解析出值并监听
      if (node.nodeType === Node.TEXT_NODE && reg.test(txt)) {
        const matched = txt.match(reg)[1];
        if (matched) {
          let arr = matched.split('.');
          let val = vm;
          arr.forEach(key => {
            val = val[key];
          });
          node.textContent = txt.replace(reg, val).trim();
          vm.$watch(matched, function (newVal) {
            node.textContent = txt.replace(reg, newVal).trim();
          });
        }
      }
      // 如果是元素节点
      if (node.nodeType === Node.ELEMENT_NODE) {
        let nodeAttr = node.attributes;
        Array.from(nodeAttr).forEach(attr => {
          let name = attr.name;
          let exp = attr.value;
          // 如果是 v- 绑定的元素，则设置节点的 value 为相应的值
          if (name.includes('v-')) {
            let arr = exp.split('.');
            let val = vm;
            arr.forEach(key => {
              val = val[key];
            });
            node.value = val;
          }
          // 设置监听
          vm.$watch(exp, function (newVal) {
            node.value = newVal;
          });

          // 处理 input ，将input的值设置到对应属性上
          node.addEventListener('input', e => {
            let newValue = e.target.value;
            let arr = exp.split('.');
            let val = vm;
            arr.forEach((key, i) => {
              if (i === arr.length - 1) {
                val[key] = newValue;
                return;
              }
              val = val[key];
            });
          });
        });
      }

      // 如果还有子节点，递归replace
      if (node.childNodes && node.childNodes.length) {
        this.replace(node, vm);
      }
    });
  }
}









