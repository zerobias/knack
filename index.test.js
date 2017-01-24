const test = require('tap').test
const Knack = require('./index')

const halt = () => process.exit()
const pause = (delay = 3e3) => new Promise(rs => setTimeout(rs, delay))

const Order = t => {
  const order = [
    'a',
    'f',
    'd',
    'c',
    'e',
    'b',
    'c1',
    'e1',
    'e2',
  ]
  let count = 0
  return endFunc => {
    t.equal(endFunc, order[count], `now should ends ${order[count]}`)
    count++
  }
}

test('constants test', t => {
  const pool = Knack()
  t.ok(Knack.timeouts, 'consts in constructor')
  t.ok(pool.timeouts, 'consts in object')
  t.end()
})

test('object fields', t => {
  const pool = Knack()
  t.type(pool.active, 'number', 'active tasks counter')
  t.type(pool.concurrency, 'number', 'parallel execution bandwidth')
  t.type(pool.interval, 'number', 'refresh interval')
  t.equals(pool.isHalt, false, 'halt boolean field')
  t.ok(Knack.timeouts, 'consts in constructor')
  t.ok(pool.timeouts, 'consts in object')
  t.notThrow(pool.halt, 'safely halt')
  t.equals(pool.isHalt, true, 'pool is switch off')
  t.end()
})

const repeatTest = () => test('repeat test', t => {
  const pool = Knack()
  let count = 0
  const startStopFunc = () => new Promise(rs => {
    console.log(`start repeat`)
    count+=1
    if (count>=3){
      rs('ok')
    }
  })

  const startStop = pool(startStopFunc, { onTimeout: 'repeat', timeout: 2e3 })
  startStop().then(t.end, t.fail)
})

const debounceTest = () => test('debounce test', t => {
  const pool = Knack()
  t.plan(1)
  const startStopFunc = () => new Promise(rs => {
    console.log(`start debounce`)
    pause(3000).then(() => {
      console.log(`stop debounce`)
      t.ok('ok')
      rs('ok')
    })
  })

  const startStop = pool(startStopFunc, { debounce: true })
  startStop()
  startStop()
  startStop()
  startStop()
})

const timeoutTest = () => test('timeout test', t => {
  const pool = Knack()
  const startStopFunc = () => new Promise(() =>
    console.log(`start timeout`))

  const startStop = pool(startStopFunc, { onTimeout: 'reject', timeout: 4e3 })
  startStop().then(t.fail, t.end)
})

test('Order test', t => {
  const order = Order(t)
  t.plan(9)

  const startStopFunc = (tag, delay = 3e3) => {
    console.log(`start ${tag} delay ${delay}`)
    return pause(delay).then(() => {
      console.log(`end ${tag}`)
      order(tag)
    })
  }

  const pool = Knack({ concurrency: 3, interval: 100 })
  const startStop = pool(startStopFunc)
  const startStopPrior = pool(startStopFunc, { priority: 55 })

  startStop('a', 1000)
  startStopPrior('b', 6400).then(() => console.log(`after b now executed ${pool.active}`))

  startStop('c', 4300).then(() => startStop('c1'))
  startStop('d', 1800)
  startStop('e')
    .then(() => startStop('e1', 2700))
    .then(() => startStop('e2'))
  startStopPrior('f', 500)
    .then(() => console.log(`after f now executed ${pool.active}`))
})
  .then(debounceTest, halt)
  .then(repeatTest, halt)
  .then(timeoutTest, halt)
  .then(halt)