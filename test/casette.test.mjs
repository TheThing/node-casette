import c from '../lib/casette.mjs'
import assert from '../lib/assert.mjs'
import { printError } from '../lib/cli.mjs'

let testsWereRun = false

function CreateT() {
  const t = new c.Casette()
  t.reporter = ''
  return t
}

c.test('Casette describe should add prefix to the group tests', async function() {
  testsWereRun = true
  const assertPrefix = 'something'
  const assertName = 'blabla'
  const t = CreateT()
  t.begin()
  t.setFilename('test')
  t.describe(assertPrefix, function() {
    t.test(assertName, function() {})
  })

  assert.strictEqual(t.groupsFlat.length, 1)
  assert.strictEqual(t.groupsFlat[0].tests.length, 1)
  assert.strictEqual(t.groupsFlat[0].tests[0].name, assertPrefix + ' ' + assertName)
})

c.test('Casette describe should add prefix to individual tests', async function() {
  testsWereRun = true
  const assertPrefix = 'something'
  const assertName = 'blabla'
  const t = CreateT()
  t.begin()
  t.describe(assertPrefix, function() {
    t.test(assertName, function() {})
  })

  assert.strictEqual(t.tests.length, 1)
  assert.strictEqual(t.tests[0].name, assertPrefix + ' ' + assertName)
})

c.test('Casette describe should support multiple describe', async function() {
  testsWereRun = true
  const assertPrefix = 'something'
  const assertPrefix2 = 'else'
  const assertName = 'blabla'
  const t = CreateT()
  t.begin()
  t.describe(assertPrefix, function() {
    t.describe(assertPrefix2, function() {
      t.test(assertName, function() {})
    })
  })

  assert.strictEqual(t.tests.length, 1)
  assert.strictEqual(t.tests[0].name, assertPrefix + ' ' + assertPrefix2 + ' ' + assertName)
})

c.test('Casette should run test', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.test('', function() {
    assertIsTrue = true
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

c.test('Casette should run promised test', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.test('', function() {
    return new Promise(function(res) {
      assertIsTrue = true
      res()
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

c.test('Casette should support callback', async function() {
  testsWereRun = true
  let assertIsTrue = false
  const t = CreateT()
  t.begin()
  t.test('', function(cb) {
    setTimeout(function() {
      assertIsTrue = true
      cb()
    }, 50)
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
  assert.strictEqual(assertIsTrue, true)
})

c.test('Casette should support directly thrown errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.test('', function() {
    throw assertError
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

c.test('Casette should support promise rejected errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.test('', function() {
    return new Promise(function(res, rej) {
      rej(assertError)
    })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

c.test('Casette should support callback rejected errors', async function() {
  testsWereRun = true
  const assertError = new Error()
  const t = CreateT()
  t.begin()
  t.test('', function(cb) {
    cb(assertError)
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.strictEqual(t.failedTests[0].error, assertError)
})

c.test('Casette should support timing out tests', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.test('', function(cb) { }).timeout(50)
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
})

c.test('Casette should support timed out tests on late tests', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.test('', function(cb) {
    setTimeout(function() {
      cb()
    }, 100)
  }).timeout(50)
  await t.run()
  assert.strictEqual(t.failedTests.length, 1)
  assert.ok(t.failedTests[0].error)
  assert.match(t.failedTests[0].error.message, /50ms/)
})

c.test('Casette should support skipped tests', async function() {
  testsWereRun = true
  const t = CreateT()
  t.begin()
  t.test('', function() {
    throw new Error('Should not be called')
  }).skip()
  await t.run()
  assert.strictEqual(t.failedTests.length, 0)
})

// Extra testing to make sure tests were run at all
process.on('exit', function(e) {
  try {
    assert.strictEqual(testsWereRun, true)
  } catch(err) {
    printError(err)
    process.exit(1)
  }
  process.exit(e)
})
