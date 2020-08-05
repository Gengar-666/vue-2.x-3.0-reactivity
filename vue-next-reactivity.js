function reactive (target) {
  if (typeof target !== 'object' || target === null) {
    return target
  }

  const handler = {
    get (target, key) {
      console.log(`👿 👿 👿 👿 👿 👿 执行track 收集${key}的依赖`)
      track(target, key)
      return reactive(Reflect.get(target, key))
    },
    set (target, key, val) {
      if (val === target[key]) {
        return true
      }
      console.log(val)
      const result = Reflect.set(target, key, val)
      tigger(target, key)
      return result
    },
    deleteProperty (target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const result = Reflect.deleteProperty(target, key)

      if (hadKey) {
        tigger(target, key)
      }

      return result
    }
  }

  const proxy = new Proxy(target, handler)

  return proxy
}

let effectStacks = [] // effect栈 先进后出
const targetMap = new WeakMap() // proxy对象下的依赖关系 targetMap -> key -> depMap
function createReactiveEffect (fn) {
  const effect = function reactiveEffect () {
    if (!effectStacks.includes(effect)) {
      try {
        effectStacks.push(effect)
        console.log('🌈 🌈 🌈 🌈 🌈 🌈 添加一个effect到effect栈')
        console.log('🌈 🌈 🌈 🌈 🌈 🌈 当前effect栈：', effectStacks)
        console.log('🌈 🌈 🌈 🌈 🌈 🌈 执行effect')
        return fn()
      } finally {
        effectStacks.pop()
        console.log('🌈 🌈 🌈 🌈 🌈 🌈 当前effect执行完毕，effect任务栈删除这个effect')
        console.log('🌈 🌈 🌈 🌈 🌈 🌈 当前effect任务栈：', effectStacks)
      }
    }
  }
  return effect
}

function track (target, key) {
  // 如果代理数据为数组，则把key设置为length，否则每个index都会添加dep
  key = Array.isArray(target) ? 'length' : key
  const effect = effectStacks[effectStacks.length - 1]
  console.log('🚗 🚗 🚗 🚗 🚗 🚗 开始依赖收集')
  if (effect) {
    let depsMap = targetMap.get(target)
    console.log('🚗 🚗 🚗 🚗 🚗 🚗 获取当前代理数据', target, '的所有依赖: ', depsMap)

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
      console.log('🚗 🚗 🚗 🚗 🚗 🚗 该代理数据没有依赖初始化一个Map数据作为依赖容器', depsMap)
    }

    let dep = depsMap.get(key)
    console.log(`🚗 🚗 🚗 🚗 🚗 🚗 获取该代理数据下当前被访问key:【 ${key} 】的依赖: `, dep)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
      console.log(`🚗 🚗 🚗 🚗 🚗 🚗 key:【 ${key} 】下没有依赖，初始化一个Set数据作为依赖容器`, depsMap)
    }

    if (!dep.has(effect)) {
      dep.add(effect)
      console.log(`🚗 🚗 🚗 🚗 🚗 🚗 该key:【 ${key} 】下的依赖集合里没有该effect添加到依赖里`, dep)
      console.log('🚗 🚗 🚗 🚗 🚗 🚗 最终该代理对象:', target, '下的 targetMap', targetMap)
    }
  }
}

function tigger (target, key) {
  // 如果需要set的数据为数组，则把key设置为length，
  // 因为track里收集数组的dep是用length作为key来保存到Set里的
  key = Array.isArray(target) ? 'length' : key

  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  const effects = new Set()
  if (!key !== void 0) {
    const dep = depsMap.get(key)
    dep && dep.forEach(effect => effects.add(effect))
  }

  effects.forEach(effect => effect())
}
