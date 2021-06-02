import e from '../lib/eltro.mjs'
import assert from '../lib/assert.mjs'

function CreateT() {
  const t = new e.Eltro()
  t.reporter = ''
  return t
}

e.test('Eltro should support any value in promise fail', async function() {
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('a', function() { return new Promise(function(res, rej) { rej() }) })
    t.test('b', function() { return new Promise(function(res, rej) { rej(null) }) })
    t.test('c', function() { return new Promise(function(res, rej) { rej(undefined) }) })
    t.test('d', function() { return new Promise(function(res, rej) { rej(124523) }) })
    t.test('e', function() { return new Promise(function(res, rej) { rej('testety') }) })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 5)

  for (let x = 0; x < t.failedTests.length; x++) {
    assert.strictEqual(typeof(t.failedTests[x].error), 'object')
    assert.ok(t.failedTests[x].error.message)
    assert.ok(t.failedTests[x].error.stack)
  }
})

e.test('Eltro should support any value in throws', async function() {
  const t = CreateT()
  t.begin()
  t.describe('', function() {
    t.test('a', function() { throw null })
    t.test('b', function() { throw {} })
    t.test('c', function() { throw { message: 'test' } })
    t.test('d', function() { throw 1234 })
    t.test('e', async function() { throw null })
    t.test('f', async function() { throw {} })
    t.test('g', async function() { throw { message: 'test' } })
    t.test('h', async function() { throw 1234 })
  })
  await t.run()
  assert.strictEqual(t.failedTests.length, 8)

  for (let x = 0; x < t.failedTests.length; x++) {
    assert.strictEqual(typeof(t.failedTests[x].error), 'object')
    assert.ok(t.failedTests[x].error.message)
    assert.ok(t.failedTests[x].error.stack)
  }
})
