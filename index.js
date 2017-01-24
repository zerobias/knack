const timeouts = {
  none  : 'none',
  reject: 'reject',
  repeat: 'repeat'
}

const pause = delay => new Promise(rs => setTimeout(rs, delay, delay))

class Queue {
  constructor(concurrency, interval) {
    this.priority = new WeakMap
    this.concurrency = concurrency
    this.interval = interval
    this.active = 0
    this.pendingList = []
    this.endHook = this.endHook.bind(this)
    this.tryNext = this.tryNext.bind(this)
  }
  get pending() {
    return this.pendingList.length
  }
  tryNext() {
    if (this.active >= this.concurrency) return
    if (this.pending === 0)
      return setTimeout(this.tryNext, this.interval)
    this.active+=1
    this.pendingList.shift()()
  }
  addPending(thunk, priority) {
    const reducer = (acc, val) => priority > this.priority.get(val)
      ? val
      : acc
    const finded = this.pendingList.reduceRight(reducer, null)
    if (finded) {
      const index = this.pendingList.lastIndexOf(finded)
      console.log('index', index)
      this.pendingList.splice(index, 0, thunk)
    }
    else this.pendingList.push(thunk)
    this.priority.set(thunk, priority)
    console.log(this.priority.get(thunk))
    this.tryNext()
  }
  endHook() {
    this.active-=1
    this.tryNext()
  }
  register(promise, rs, rj) {
    // const promise = func(...args)
    promise.then(rs, rj)
    promise.then(this.endHook, this.endHook)
    return promise
  }
  onNone(func, args) {
    return func(...args)
  }
  onReject(func, args, timeout) {
    const promise = func(...args)
    const timer = pause(timeout).then(Promise.reject)
    return Promise.race([promise, timer])
  }
  onRepeat(func, args, timeout, repeats) {
    let isTimer
    let count = 0
    const failer = () => {
      isTimer = true
      return Promise.reject()
    }
    const starter = () => {
      isTimer = false
      const promise = func(...args)
      const timer = pause(timeout).then(failer)
      return Promise.race([promise, timer]).then(e => e, repeater)
    }
    const repeater = rj => {
      count+=1
      return isTimer && count < repeats
        ? starter()
        : Promise.reject(rj)
    }
    return starter()
  }
  switchTimeout(onTimeout) {
    switch (onTimeout) {
      case timeouts.none: return this.onNone
      case timeouts.reject: return this.onReject
      case timeouts.repeat: return this.onRepeat
    }
  }
  task(func, { priority, onTimeout, timeout, repeats }={}, ...args) {
    const self = this
    return new Promise((rs, rj) =>
      self.addPending(() => {
        const promise = self.switchTimeout(onTimeout)(
          func, args, timeout, repeats)
        return self.register(promise, rs, rj)
      }, priority))
  }
}

/**
 * Create Queue wrapper
 *
 * @param {any} [{ concurrency = 5, interval = 500 }={}] options
 */
function Knack({ concurrency = 5, interval = 500 }={}) {
  const q = new Queue(concurrency, interval)
  /**
   * @func knack
   * @template T
   * @param {function(...args): Promise<T>} func
   * @returns {function(...args): Promise<T>}
   */
  const knack = function(func, {
    priority = 50,
    onTimeout = timeouts.none,
    timeout = 30e3,
    repeats = 3 }={}) {
    return (...args) => q.task(func, { priority, onTimeout, timeout, repeats }, ...args)
  }
  knack.once = ({
    priority = 50,
    onTimeout = timeouts.none,
    timeout = 30e3,
    repeats = 3 }={}) => (func, ...args) => q.task(func, { priority, onTimeout, timeout, repeats }, ...args)
  knack.isHalt = false
  knack.halt = () => {
    q.tryNext = () => {}
    q.task = () => {}
    knack.isHalt = true
  }
  Object.defineProperty(knack, 'active', {
    get: () => q.active
  })
  Object.defineProperty(knack, 'concurrency', {
    get: () => q.concurrency
    // set: parallel => q.concurrency = parallel
  })
  Object.defineProperty(knack, 'interval', {
    get: () => q.interval
    // set: delay => q.interval = delay
  })
  knack.timeouts = timeouts
  return knack
}

Knack.timeouts = timeouts

module.exports = Knack
