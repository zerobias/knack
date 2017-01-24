# knack

[![NPM version][npm-image]][npm-url]
[![Unix Build Status][travis-image]][travis-url]
[![Windows Build Status][appveyor-image]][appveyor-url]
[![Coveralls Status][coveralls-image]][coveralls-url]
[![Dependency Status][depstat-image]][depstat-url]

**Knack** transparently manages the execution of the asynchronous functions as a queue with a predetermined width

Knack simply wraps any promise-returning function and returns function, executed in a queue

## Install

    npm install --save knack

## Usage

```js
import Knack from 'knack'

function asyncFunc(param) {
  return Promise.resolve(param)
}

// All fields are optional
const knack = Knack({
  concurrency: 10,
  interval: 100,
  onDone: () => console.log('all tasks are done')
})

// Make wrapped function
const asyncQueued = knack(asyncFunc)
asyncQueued('ok')
// => Promise<'ok'>

// Or just make queue task executor
const task = knack.once()
task(asyncFunc, 'ok')
// => Promise<'ok'>
```

## License

MIT © [Zero Bias](https://github.com/zerobias)

[npm-url]: https://npmjs.org/package/knack
[npm-image]: https://img.shields.io/npm/v/knack.svg?style=flat-square

[travis-url]: https://travis-ci.org/zerobias/knack
[travis-image]: https://img.shields.io/travis/zerobias/knack.svg?style=flat-square&label=unix

[appveyor-url]: https://ci.appveyor.com/project/zerobias/knack
[appveyor-image]: https://img.shields.io/appveyor/ci/zerobias/knack.svg?style=flat-square&label=windows

[coveralls-url]: https://coveralls.io/r/zerobias/knack
[coveralls-image]: https://img.shields.io/coveralls/zerobias/knack.svg?style=flat-square

[depstat-url]: https://david-dm.org/zerobias/knack
[depstat-image]: https://david-dm.org/zerobias/knack.svg?style=flat-square
