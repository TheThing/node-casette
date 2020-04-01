import util from 'util'
import assert from 'assert'
import assertExtended from '../lib/assert.mjs'

import t from '../lib/eltro.mjs'

const testLongObject = {
  a: 1, b:2, c:3, d:4,
  e: {herp: 51, derp: 23},
  f: 'asdfgagwegawegawegawegawe',
  g: '32ghaiwugb23 238023'
}

t.describe('#notOk()', function() {
  t.test('should exist', function() {
    assertExtended.ok(assertExtended.notOk)
  })
  
  t.test('should throw for true values', function() {
    assertExtended.throws(function() {
      assertExtended.notOk(true)
    }, assertExtended.AssertionError)
  })
  
  t.test('should pass for false values', function() {
    assertExtended.notOk(false)
    assertExtended.notOk(null)
    assertExtended.notOk(0)
  })
})

t.describe('#isFulfilled()', function() {
  t.test('should exist', function() {
    assertExtended.ok(assertExtended.isFulfilled)
  })
  
  t.test('should throw for rejected promises', function() {
    return assertExtended.isFulfilled(Promise.reject({}))
      .catch((err) => {
        assertExtended.ok(err.message.match(/promise fail/))
      })
  })
  
  t.test('should properly parse rejected object response', function() {
    let assertMessage = util.inspect(testLongObject, {depth: 1}).replace(/\n /g, '')
    assertMessage = assertMessage.slice(0, 64) + '...'
  
    return assertExtended.isFulfilled(Promise.reject(testLongObject))
      .catch((err) => 
        assertExtended.notStrictEqual(err.message.indexOf(assertMessage), -1)
      )
  })
  
  t.test('should include error message if error', function() {
    const assertMessage = 'something something dark side'
    return assertExtended.isFulfilled(Promise.reject(new Error(assertMessage)))
      .catch((err) => {
        assertExtended.ok(err.message.match(new RegExp('with ' + assertMessage)))
      })
  })
  
  t.test('should pass for resolved promises', function() {
    return assertExtended.isFulfilled(Promise.resolve())
  })
  
  t.test('should support custom message', function() {
    const assertMessage = 'something something dark side'
    return assertExtended.isFulfilled(Promise.reject({}), assertMessage)
      .catch((err) => {
        assertExtended.ok(err.message.match(assertMessage))
      })
  })
  
  t.test('should return result for the resolved promise', function() {
    const assertResult = {a: 1}
  
    return assertExtended.isFulfilled(Promise.resolve(assertResult))
      .then((data) => assertExtended.strictEqual(data, assertResult))
  })
})

t.describe('#isRejected()', function() {
  t.test('should exist', function() {
    assertExtended.ok(assertExtended.isRejected)
  })

  t.test('should throw for resolved promises', function() {
    let hasFailed = false

    return assertExtended.isRejected(Promise.resolve({}))
      .catch((err) => {
        hasFailed = true
        assertExtended.ok(err.message.match(/fulfilled with/))
      })
      .then(function() {
        assertExtended.strictEqual(hasFailed, true)
      })
  })

  t.test('should properly stringify objects', function() {
    let assertMessage = util.inspect(testLongObject, {depth: 1}).replace(/\n /g, '')
    assertMessage = assertMessage.slice(0, 64) + '...'

    return assertExtended.isRejected(Promise.resolve(testLongObject))
      .catch((err) =>
        assertExtended.notStrictEqual(err.message.indexOf(assertMessage), -1)
      )
  })

  t.test('should support custom message', function() {
    const assertMessage = 'something something dark side'
    return assertExtended.isRejected(Promise.resolve({}), assertMessage)
      .catch((err) => assertExtended.ok(err.message.match(assertMessage)))
  })

  t.test('should return result for the unresolved promise', function() {
    const assertResult = {a: 1}

    return assertExtended.isRejected(Promise.reject(assertResult))
      .then((data) => assertExtended.strictEqual(data, assertResult))
  })
})

t.describe('#match()', function() {
  t.test('should exist', function() {
    assertExtended.ok(assertExtended.match);
  });

  t.test('should throw if no match', function() {
    assertExtended.throws(function() {
      assertExtended.match('a', /b/);
    }, assertExtended.AssertionError);
  });

  t.test('should pass if matches', function() {
    assertExtended.match('a', /a/);
  });
})

t.describe('#notMatch()', function() {
  t.test('should exist', function() {
    assertExtended.ok(assertExtended.notMatch);
  });

  t.test('should throw if match', function() {
    assertExtended.throws(function() {
      assertExtended.notMatch('a', /a/);
    }, assertExtended.AssertionError);
  });

  t.test('should pass if not matches', function() {
    assertExtended.notMatch('a', /b/);
  });
})
