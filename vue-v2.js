// 劫持data数据
const observer = o => {
  if (!o || typeof o !== 'object') {
    return
  }

  // 遍历劫持data下所有值
  for (let k of Object.keys(o)) {
    // 创建每个key唯一的dep
    let dep = new Dep()
    // 当前劫持key的值
    let value = o[k]

    // 递归反复劫持直到没数据或不再是对象
    observer(value)

    Object.defineProperty(o, k, {
      get: () => {
        // 如果有新的订阅，把新的订阅添加到dep里
        if (Dep.target) {
          dep.addSub(Dep.target)
        }
        return value
      },
      set: v => {
        // 如果新值等于旧值就不通知订阅更新视图
        if (v === value) {
          return
        }
        value = v
        //通知订阅更新视图
        dep.notify()
      }
    })
  }
}

// 管理订阅
class Dep {
  constructor() {
    // 存放所有订阅
    this.subs = []
  }

  // 添加订阅
  addSub (sub) {
    this.subs.push(sub)
  }

  // 通知所有订阅更新
  notify () {
    for (let sub of this.subs) {
      sub.update()
    }
  }
}

// 订阅
class Watcher {
  constructor(vm, prop, cb) {
    this.vm = vm
    this.prop = prop
    this.cb = cb
    // 主动获取一下值触发dep添加订阅
    this.value = this.getValue()
  }

  getValue () {
    Dep.target = this
    let v = this.vm.$data[this.prop]
    Dep.target = null
    return v
  }

  update () {
    let newVal = this.vm.$data[this.prop]
    let oldVal = this.value
    if (newVal !== oldVal) {
      this.value = newVal
      this.cb(this.value)
    }
  }
}

// 编译解析模版语法
class Compile {
  constructor(vm) {
    this.vm = vm
    this.el = vm.$el
    this.fragment = null
    this.init()
  }

  init () {
    this.fragment = this.nodeFragment(this.el)
    this.compileNode(this.fragment);
    this.el.appendChild(this.fragment);
  }

  nodeFragment (el) {
    const fragment = document.createDocumentFragment()
    let child = el.firstChild
    while (child) {
      fragment.appendChild(child)
      child = el.firstChild
    }
    return fragment
  }

  compileNode (fragment) {
    let childNodes = fragment.childNodes;
    [...childNodes].forEach(node => {

      if (this.isElementNode(node)) {
        this.compile(node);
      }

      let reg = /\{\{(.*)\}\}/;
      let text = node.textContent;

      if (reg.test(text)) {
        let prop = reg.exec(text)[1];
        this.compileText(node, prop); //替换模板
      }

      //编译子节点
      if (node.childNodes && node.childNodes.length) {
        this.compileNode(node);
      }
    });
  }

  compile (node) {
    let nodeAttrs = node.attributes;
    [...nodeAttrs].forEach(attr => {
      let name = attr.name;
      if (this.isDirective(name)) {
        let value = attr.value;
        if (name === "v-model") {
          this.compileModel(node, value);
        }
      }
    });
  }

  compileModel (node, prop) {
    let val = this.vm.$data[prop];
    this.updateModel(node, val);

    new Watcher(this.vm, prop, (value) => {
      this.updateModel(node, value);
    });

    node.addEventListener('input', e => {
      let newValue = e.target.value;
      if (val === newValue) {
        return;
      }
      this.vm.$data[prop] = newValue;
    });
  }

  compileText (node, prop) {
    let text = this.vm.$data[prop];
    this.updateView(node, text);
    new Watcher(this.vm, prop, (value) => {
      this.updateView(node, value);
    });
  }

  updateModel (node, value) {
    node.value = typeof value === 'undefined' ? '' : value;
  }

  updateView (node, value) {
    node.textContent = typeof value === 'undefined' ? '' : value;
  }

  isDirective (attr) {
    return attr.indexOf('v-') !== -1;
  }

  isElementNode (node) {
    return node.nodeType === 1;
  }

  isTextNode (node) {
    return node.nodeType === 3;
  }
}

class Mvue {
  constructor(options) {
    const { data, el, mounted } = options
    this.$options = options
    this.$data = data
    this.$el = document.querySelector(el)
    this.$mounted = mounted || function () { }

    this.init()

    this.$mounted && this.$mounted()
  }

  init () {
    observer(this.$data)

    for (let key of Object.keys(this.$data)) {
      this.proxyData(key)
    }

    new Compile(this)
  }

  // 数据代理，方便使用this.xxx获取data里的值
  proxyData (key) {
    Object.defineProperty(this, key, {
      get: () => {
        return this.$data[key]
      },
      set: v => {
        this.$data[key] = v
      }
    })
  }
}
