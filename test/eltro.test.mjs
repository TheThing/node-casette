import e from '../lib/eltro.mjs'
import assert from '../lib/assert.mjs'
import { printError } from '../lib/cli.mjs'

let testsWereRun = false

function CreateT() {
  const t = new e.Eltro()
  t.reporter = ''
  return t
}

e.test('Eltro should fail if tests are not within a group', function() {
  assert.throws(function() {
    const t = CreateT()
    t.begin()
    t.test('should throw', function() {})
  }, function(e) {
    assert.match(e.message, /outside/)
    return true
  })
})

e.test('Eltro describe should group tests', async function() {
  testsWereRun = true
  const assertPrefix = 'something'
  const assertName = 'blabla'
  const t = CreateT()
  t.begin()
  t.describe(assertPrefix, function() {
    t.test(assertName, function() {})
  })

  assert.strictEqual(t.groups.length, 1)
  assert.strictEqual(t.groups[0].tests.length, 1)
  assert.strictEqual(t.groups[0].tests[0].name, assertPrefix + ' ' + assertName)
})

e.test('Eltro setFilename should activate a new for said file', async function() {
  testsWereRun = true
  const assertFilePrefix = 'testety'
  const assertPrefix = 'something'
  const assertName = 'blabla'
  const t = CreateT()
  t.begin()
  t.setFilename(assertFilePrefix)
  t.describe(assertPrefix, function() {
    t.test(assertName, function() {})
  })

  assert.strictEqual(t.groups.length, 1)
  assert.strictEqual(t.groups[0].tests.length, 0)
  assert.strictEqual(t.groups[0].groups.length, 1)
  assert.strictEqual(t.groups[0].groups[0].tests.length, 1)
  assert.strictEqual(t.groups[0].groups[0].tests[0].name, assertFilePrefix + ': ' + assertPrefix + ' ' + assertName)
})

e.test('Eltro describe should support nested describe', async function() {
  testsWereRun = true
  const assertPrefix = 'something'
  const assertPrefix2 = 'else'
  const assertName = 'blabla'
  const assertFile = 'asdf.js'
  const t = CreateT()
  t.begin()
  t.setFilename(assertFile)
  t.describe(assertPrefix, function() {
    t.describe(assertPrefix2, function() {
      t.test(assertName, function() {})
    })
  })
  t.resetFilename()

  assert.strictEqual(t.groups.length, 1)
  assert.strictEqual(t.groups[0].groups.length, 1)
  assert.strictEqual(t.groups[0].groups[0].groups.length, 1)
  assert.strictEqual(t.groups[0].groups[0].groups[0].tests[0].name, assertFile + ': ' + assertPrefix + ' ' + assertPrefix2 + ' ' + assertName)
})

e.test('Eltro should run test', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function() {
      assertIsTrue = true
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should run tests in nested groups', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('1', function() {
    t.describe('2', function() {
      t.describe('3', function() {
        t.test('', function() {
          assertIsTrue = true
        })
      })
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should run promised test', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function() {
      return new Promise(function(res) {
        assertIsTrue = true
        res()
      })
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support callback', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function(cb) {
      setTimeout(function() {
        assertIsTrue = true
        cb()
      }, 25)
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support directly thrown errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function() {
      throw assertError
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support promise rejected errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function() {
      return new Promise(function(res, rej) {
        rej(assertError)
      })
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support callback rejected errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function(cb) {
      cb(assertError)
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support timing out tests', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function(cb) { }).timeout(50)
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
})

e.test('Eltro should support timed out tests on late tests', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function(cb) {
      setTimeout(function() {
        cb()
      }, 100)
    }).timeout(50)
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
})

e.test('Eltro should support timed out tests in front', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()

  t.describe('', function() {
    t.timeout(25).test('', function(cb) { setTimeout(cb, 50) })
    t.test('', function(cb) { setTimeout(cb, 50) })
  })

  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /25ms/)
})

e.test('Eltro should support skipped tests', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('', function() {
      throw new Error('Should not be called')
    }).skip()
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
})

e.test('Eltro should support only tests', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('a', function() { throw new Error('Should not be called') })
    t.test('b', function() { throw new Error('Should not be called') })
    t.test('c', function() { assertIsTrue = true }).only()
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support skipped tests in front of the test', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  
  t.describe('', function() {
    t.skip().test('', function() { throw new Error('Should not be called') })
    t.test('', function() { assertIsTrue = true })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support before() functions in describe group', async function() {
  testsWereRun = true
  let assertRan = 0
  let firstBefore = 0
  let secondBefore = 0
  let thirdBefore = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function() {
      firstBefore = assertRan
    })

    t.describe('', function() {
      t.before(function() {
        secondBefore = assertRan
      })

      t.test('', function() { assertRan++ })
      t.test('', function() { assertRan++ })
      t.test('', function() { assertRan++ })
    })

    t.describe('', function() {      
      t.before(function() {
        thirdBefore = assertRan
      })

      t.test('', function() { assertRan++ })
    })

    t.test('', function() { assertRan++ })
  })
  let stats = await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertRan, 5)
  assert.strictEqual(stats.passed, 5)
  assert.strictEqual(firstBefore, 0)
  assert.strictEqual(secondBefore, 1)
  assert.strictEqual(thirdBefore, 4)
})

e.test('Eltro should support before() functions in describe, timing out', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function(cb) { }).timeout(50)
    t.test('', function() { assertRan++ })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
  assert.strictEqual(assertRan, 0)
})

e.test('Eltro should support before() functions in describe, late timing out', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function(cb) {
      setTimeout(cb, 100)
    }).timeout(50)
    t.test('', function() { assertRan++ })
  })
  t.describe('', function() {
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
  assert.strictEqual(assertRan, 2)
})

e.test('Eltro should support before() functions in describe, timing out in front', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.timeout(25).before(function(cb) { setTimeout(cb, 50) })
    t.test('', function() { assertRan++ })
  })
  t.describe('', function() {
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /25ms/)
  assert.strictEqual(assertRan, 2)
})

e.test('Eltro should support before() functions in describe, being promised', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function() {
      return new Promise(function(res) {
        assertIsTrue = true
        res()
      })
    })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support before() functions in describe, support callback', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function(cb) {
      setTimeout(function() {
        assertIsTrue = true
        cb()
      }, 25)
    })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support before() functions in describe, support directly thrown errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function() {
      throw assertError
    })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support before() functions in describe, support rejected promises', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function() {
      return new Promise(function(res, rej) {
        rej(assertError)
      })
    })
    t.test('', function() {})
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support before() functions in describe, support callback rejected', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.before(function(cb) { cb(assertError) })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})


e.test('Eltro should support after() functions in describe group', async function() {
  testsWereRun = true
  let assertRan = 0
  let firstAfter = 0
  let secondAfter = 0
  let thirdAfter = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function() {
      firstAfter = assertRan
    })

    t.describe('', function() {
      t.after(function() {
        secondAfter = assertRan
      })

      t.test('', function() { assertRan++ })
      t.test('', function() { assertRan++ })
      t.test('', function() { assertRan++ })
    })

    t.describe('', function() {      
      t.after(function() {
        thirdAfter = assertRan
      })

      t.test('', function() { assertRan++ })
    })

    t.test('', function() { assertRan++ })
  })
  let stats = await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(stats.passed, 5)
  assert.strictEqual(assertRan, 5)
  assert.strictEqual(firstAfter, 5)
  assert.strictEqual(secondAfter, 4)
  assert.strictEqual(thirdAfter, 5)
})

e.test('Eltro should support after() functions in describe, timing out', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function(cb) { }).timeout(50)
    t.test('', function() { assertRan++ })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
  assert.strictEqual(assertRan, 1)
})

e.test('Eltro should support after() functions in describe, late timing out', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function(cb) {
      setTimeout(cb, 100)
    }).timeout(50)
    t.test('', function() { assertRan++ })
  })
  t.describe('', function() {
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
  assert.strictEqual(assertRan, 3)
})

e.test('Eltro should support after() functions in describe, timing out in front', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.timeout(25).after(function(cb) { setTimeout(cb, 50) })
    t.test('', function() { assertRan++ })
  })
  t.describe('', function() {
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
    t.test('', function(cb) { assertRan++; setTimeout(cb, 25) })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /25ms/)
  assert.strictEqual(assertRan, 3)
})


e.test('Eltro should support after() functions in describe, being promised', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function() {
      return new Promise(function(res) {
        assertIsTrue = true
        res()
      })
    })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support after() functions in describe, support callback', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function(cb) {
      setTimeout(function() {
        assertIsTrue = true
        cb()
      }, 25)
    })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support after() functions in describe, support directly thrown errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function() {
      throw assertError
    })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support after() functions in describe, support rejected promises', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function() {
      return new Promise(function(res, rej) {
        rej(assertError)
      })
    })
    t.test('', function() {})
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support after() functions in describe, support callback rejected', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.after(function(cb) { cb(assertError) })
    t.test('', function() { })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

e.test('Eltro should support only tests in front of the test', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  
  t.describe('', function() {
    t.test('a', function() { throw new Error('Should not be called') })
    t.only().test('b', function() { assertIsTrue = true })
    t.test('c', function() { throw new Error('Should not be called') })
  })

  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

e.test('Eltro should support timed out describes', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  
  t.describe('', function() {
    t.timeout(10).describe('', function() {
      t.test('', function(cb) { setTimeout(cb, 25) })
      t.test('', function(cb) { setTimeout(cb, 25) })
    })
    t.describe('', function() {
      t.test('', function(cb) { setTimeout(cb, 25) })
    })
    t.test('', function(cb) { setTimeout(cb, 25) })
  })

  await t.run()
  assert.strictEqual(t.failedTests.length, 2)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /10ms/)
  assert.ok(t.failedTests[1].error)
  assert.match(t.failedTests[1].error.message, /10ms/)
})

e.test('Eltro should support skipped tests in describe', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.skip().describe('', function() {
      t.test('', function() { throw new Error('Should not be called') })
      t.test('', function() { throw new Error('Should not be called') })
      t.test('', function() { throw new Error('Should not be called') })
    })
    t.describe('', function() {
      t.test('', function() { assertRan++ })
    })
    t.test('', function() { assertRan++ })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertRan, 2)
})

e.test('Eltro should have skip at higher importance than only', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.skip().describe('', function() {
      t.only().test('', function() { throw new Error('Should not be called') })
      t.only().test('', function() { throw new Error('Should not be called') })
      t.only().test('', function() { throw new Error('Should not be called') })
    })
    t.describe('', function() {
      t.test('', function() { assertRan++ })
    })
    t.test('', function() { assertRan++ })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0, 'failed tests should be 0 but was ' + t.failedTests.length)
  assert.strictEqual(assertRan, 2, 'tests run should be two but was ' + assertRan)
})

e.test('Eltro should support nested skip in describe commands', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.skip().describe('', function() {
      t.describe('', function() {
        t.only().test('', function() { throw new Error('Should not be called') })
        t.only().test('', function() { throw new Error('Should not be called') })
        t.only().test('', function() { throw new Error('Should not be called') })
      })
    })
    t.describe('', function() {
      t.test('', function() { assertRan++ })
    })
    t.test('', function() { assertRan++ })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertRan, 2)
})

e.test('Eltro should support only tests in front of the test', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.only().describe('', function() {
      t.test('', function() { assertRan++ })
      t.test('', function() { assertRan++ })
    })
    t.describe('', function() {
      t.test('a', function() { throw new Error('Should not be called') })
    })
    t.test('c', function() { throw new Error('Should not be called') })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0, 'failed tests should be 0 but was ' + t.failedTests.length)
  assert.strictEqual(assertRan, 2)
})

e.test('Eltro should support nexted only tests in front of the test', async function() {
  testsWereRun = true
  let assertRan = 0
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.only().describe('', function() {
      t.describe('', function() {
        t.test('', function() { assertRan++ })
        t.test('', function() { assertRan++ })
      })
    })
    t.describe('', function() {
      t.test('a', function() { throw new Error('Should not be called') })
    })
    t.test('c', function() { throw new Error('Should not be called') })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0, 'failed tests should be 0 but was ' + t.failedTests.length)
  assert.strictEqual(assertRan, 2)
})

e.test('Eltro should support nested timed out describes', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.timeout(10).describe('', function() {
      t.describe('', function() {
        t.test('', function(cb) { setTimeout(cb, 25) })
        t.test('', function(cb) { setTimeout(cb, 25) })
      })
    })
    t.describe('', function() {
      t.test('', function(cb) { setTimeout(cb, 25) })
    })
    t.test('', function(cb) { setTimeout(cb, 25) })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 2)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /10ms/)
  assert.ok(t.failedTests[1].error)
  assert.match(t.failedTests[1].error.message, /10ms/)
})

e.test('Eltro nested timeout should work as expected', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.timeout(50).describe('', function() {
      t.timeout(10).describe('', function() {
        t.test('', function(cb) { setTimeout(cb, 25) })
      })
      t.test('', function(cb) { setTimeout(cb, 25) })
    })
    t.describe('', function() {
      t.test('', function(cb) { setTimeout(cb, 25) })
    })
    t.test('', function(cb) { setTimeout(cb, 25) })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /10ms/)
})

// Extra testing to make sure tests were run at all
process.on('exit', function(e) {
  try {
    assert.strictEqual(testsWereRun, true)
  } catch(err) {
    console.log('Checking if tests were run at all failed:')
    printError(err)
    process.exit(1)
  }
  process.exit(e)
})
