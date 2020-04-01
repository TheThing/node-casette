import { printError } from './cli.mjs'

function Group(name) {
  this.name = name
  this.hasExclusive = false
  this.tests = []
}

function Test(e, group, name, func) {
  this.e = e
  this.group = group
  this.skipTest = false
  this.isExclusive = false
  this.customTimeout = null
  this.name = name
  this.func = func
  this.error = null
}

Test.prototype.timeout = function(time) {
  this.customTimeout = time
}

Test.prototype.skip = function() {
  this.skipTest = true
}

Test.prototype.only = function() {
  this.e.hasExclusive = this.group.hasExclusive = this.isExclusive = true
}

function Eltro() {
  this.__timeout = 2000
  this.hasExclusive = false
  this.reporter = 'list'
  this.Eltro = Eltro
  this.groups = new Map()
  this.groupsFlat = []
  this.tests = []
  this.failedTests = []
  this.hasTests = false
  this.starting = false
  this.filename = ''
  this.prefix = ''
  this.temporary = {
    timeout: 0,
    skip: false,
    only: false
  }
}

Eltro.prototype.begin = function() {
  if (this.starting) {
    console.warn('WARNING: Multiple calls to Eltro.begin were done.')
    return
  }
  this.hasTests = false
  this.starting = true
  this.filename = ''
  this.prefix = ''
  this.groups.clear()
  this.tests.splice(0, this.tests.length)
}

Eltro.prototype.__runTest = async function(stats, test) {
  if (this.reporter === 'list') {
    process.stdout.write('    \x1b[90m? ' + test.name + '\x1b[0m')
  }

  if (!test.skipTest) {
    await new Promise((resolve, reject) => {
      // Flag to check if we finished
      let finished = false
      let timeout = test.customTimeout || this.__timeout

      // Timeout timer in case test times out
      let timer = setTimeout(function() {
        if (finished === true) return
        reject(new Error('timeout of ' + timeout + 'ms exceeded. Ensure the done() callback is being called in this test.'))
      }, timeout)

      // start the test runner
      try {
        // Does it accept a callback
        let checkIsCallback = (test.func.toString()).match(/^(function)? *\([^\)]+\)/)
        let promise

        // If the test requires callback, wrap it in a promise where callback
        // either resolves or rejects that promise
        if (checkIsCallback) {
          promise = new Promise(function(res, rej) {
            test.func(function(err) {
              if (err) {
                return rej(err)
              }
              res()
            })
          })
        } else {
          // Function doesn't require a callback, run it directly
          promise = test.func()
        }

        // Check if the function we ran returned a promise
        if (promise && promise.then && typeof(promise.then === 'function')) {
          // If the promise from the function succeeded, resolve our promise.
          // Otherwise reject it
          promise.then(function() {
            // check if our test had already finished and if so, do nothing
            if (finished === true) return

            finished = true
            clearTimeout(timer)
            resolve()
          }, function(err) {
            // check if our test had already finished and if so, do nothing
            if (finished === true) return

            finished = true
            clearTimeout(timer)
            reject(err)
          })
        } else {
          // check if our test had already finished and if so, do nothing
          if (finished === true) return

          // Possible this was a synchronous test, pass immediately
          finished = true
          clearTimeout(timer)
          resolve()
        }
      } catch (err) {
        // check if our test had already finished and if so, do nothing
        if (finished === true) return

        // An error occured while running function. Possible exception
        // during a synchronous test or something else.
        finished = true
        clearTimeout(timer)
        reject(err)
      }
    })
    .then(function() {
        stats.passed++
      }, function(err) {
        test.error = err
        stats.failed++
      }
    )
  } else {
    stats.skipped++
  }

  if (test.error) {
    this.failedTests.push(test)
  }

  if (this.reporter === 'list') {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    if (test.skipTest) {
      process.stdout.write('    \x1b[94m- ' + test.name + '\x1b[0m\n')
    } else if (!test.error) {
      process.stdout.write('    \x1b[32m√\x1b[90m ' + test.name + '\x1b[0m\n')
    } else {
      process.stdout.write('    \x1b[31m' + this.failedTests.length + ') ' + test.name + '\x1b[0m\n')
    }
  } else if (this.reporter === 'dot') {
    if (test.skipTest) {
      process.stdout.write('\x1b[94m.\x1b[0m')
    } else if (!test.error) {
      process.stdout.write('\x1b[32m.\x1b[0m')
    } else {
      process.stdout.write('\x1b[31m.\x1b[0m')
    }
  }
}

Eltro.prototype.run = async function() {
  if (this.reporter) {
    console.log('')
    console.log('')
  }

  let stats = {
    passed: 0,
    failed: 0,
    skipped: 0,
  }

  let start = process.hrtime()
  for (let i = 0; i < this.groupsFlat.length; i++) {
    let g = this.groupsFlat[i];

    if (g.hasExclusive === this.hasExclusive) {
      if (this.reporter === 'list') {
        console.log('  ' + g.name)
      }
      for (let x = 0; x < g.tests.length; x++) {
        await this.__runTest(stats, g.tests[x])
      }
    }
  }

  for (let x = 0; x < this.tests.length; x++) {
    if (this.tests[x].isExclusive === this.hasExclusive) {
      await this.__runTest(stats, this.tests[x])
    }
  }
  let end = process.hrtime(start)

  if (this.reporter) {
    console.log('')
    console.log('')
    if (stats.passed) {
      console.log('  \x1b[32m' + stats.passed + ' passing \x1b[90m(' + (end[0] * 1000 + Math.round(end[1] / 1000000)) + 'ms)\x1b[0m')
    }
    if (stats.failed) {
      console.log('  \x1b[31m' + stats.failed + ' failing\x1b[0m')
    }
    if (stats.skipped) {
      console.log('  \x1b[94m' + stats.skipped + ' pending\x1b[0m')
    }
    console.log('')

    if (this.failedTests.length) {
      for (let x = 0; x < this.failedTests.length; x++) {
        let test = this.failedTests[x];
        console.log('  ' + (x + 1) + ') '
          + (test.group ? test.group.name + ': ' : '' )
          + test.name + ':'
        )
        printError(test.error)
      }
    }
  }
}

Eltro.prototype.setFilename = function(filename) {
  this.filename = filename
}

Eltro.prototype.resetFilename = function() {
  this.filename = ''
}

Eltro.prototype.describe = function(name, func) {
  let before = this.prefix
  if (before) {
    this.prefix = before + ' ' + name
  } else {
    this.prefix = name
  }
  func()
  this.prefix = before
}

/*Test.prototype.timeout = function(time) {
  this.customTimeout = time
}

Test.prototype.skip = function() {
  this.skipTest = true
}

Test.prototype.only = function() {
  this.e.hasExclusive = this.group.hasExclusive = this.isExclusive = true
}*/

Eltro.prototype.timeout = function(time) {
  this.temporary.timeout = time
  return this
}

Eltro.prototype.skip = function() {
  this.temporary.skip = true
  return this
}

Eltro.prototype.only = function() {
  this.temporary.only = true
  return this
}

Eltro.prototype.test = function(name, func) {
  let targetName = name
  if (this.prefix) {
    targetName = this.prefix + ' ' + name
  }
  this.hasTests = true

  let group = this
  if (this.filename) {
    if (!this.groups.has(this.filename)) {
      let g = new Group(this.filename)
      this.groupsFlat.push(g)
      this.groups.set(this.filename, g)
    }
    group = this.groups.get(this.filename)
  }
  let test = new Test(this, group, targetName, func)
  group.tests.push(test)

  if (this.temporary.only) {
    test.only()
    this.temporary.only = false
  }
  if (this.temporary.skip) {
    test.skip()
    this.temporary.skip = false
  }
  if (this.temporary.timeout) {
    test.timeout(this.temporary.timeout)
    this.temporary.timeout = 0
  }
  return test
}

export default new Eltro()
