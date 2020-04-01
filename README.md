# eltro
Eltro is a no-nonsense, no dependancy small test framework created to use in node 13 with ECM.

# Installation

Install with npm globally:

```bash
$ npm install --global eltro
```

or as a development dependency for your project:

```bash
$ npm install --save-dev eltro
```

# Getting started

```bash
$ npm install --save-dev eltro
$ mkdir test
```

Next in your favourite editor, create `test/test.js`:

```node
import { Eltro as t, assert} from 'eltro'

t.describe('Array', function() {
  t.describe('#indexOf()', function() {
    t.test('should return -1 when value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1)
    })
  })
})
```

Set up a test script in packagt.json:

```json
"scripts": {
  "test": "mocha"
}
```

Then run tests with:

```bash
$ npm test


  test/test.mjs
    √ Array #indexOf() should return -1 when value is not present


  1 passing (3ms)
```

#  Assertions

Not only does eltro allow you to use any assertion library of your own choosing, it also comes with it's own assertion library based on node's default [assert](https://nodejs.org/api/assert.html) with a few extra methods:

 * `assert.notOk(value, [message])`: Assert value is not ok.
 * `assert.match(value, test, [message])`: Check if value matches RegExp test.
 * `assert.notMatch(value, [message])`: Check if value does not match RegExp test.
 * `assert.isFulfilled(promise, [message])`: Assert the promise resolves.
 * `assert.isRejected(promise, [message])`: Assert the promise gets rejects.
 
 # Asynchronous Code

Eltro supports any type of asynchronous code testing. It can either be done by adding a parameter to the function (usually done) that gets called once the tests done but eltro also supports promises.

Example of testing using done:

```node
import { Eltro as t, assert} from 'eltro'

t.describe('User', function() {
  t.describe('#save()', function() {
    t.test('should save without error', function(done) {
      var user = new User('Luna')
      user.save(function(err) {
        if (err) done(err)
        else done()
      })
    })
  })
})
```

Alternatively, just use the done() callback directly (which will handle an error argument, if it exists):

```node
import { Eltro as t, assert} from 'eltro'

t.describe('User', function() {
  t.describe('#save()', function() {
    t.test('should save without error', function(done) {
      var user = new User('Luna')
      user.save(done)
    })
  })
})
```

Or another alternative is to use promises and return a promise directly:

```node
import { Eltro as t, assert} from 'eltro'

t.test('should complete this test', function(done) {
  return new Promise(function(resolve, reject) {
    reject(new Error('Uh oh, something went wrong'))
  }).then(done)
})
```

Which works well with `async/await` like so:

```node
t.test('async test', async function() {
  let user = await User.find({ username: 'test' })
  assert.ok(user)
})
```

# Api

### t.test(message, func)

Queue up the `func` as a test with the specified messagt.

### t.describe(message, func)

In case you wanna describe a bunch of tests, you can add them inside `func` and it will have the specified `message` prepended before every test:

```node
import { Eltro as t, assert} from 'eltro'

function someFunction() { return true }

t.test('#someFunction()', function() {
  t.test('should always return true', function() {
    assert.strictEqual(someFunction(), true)
    assert.strictEqual(someFunction(), true)
    assert.strictEqual(someFunction(), true)
  }).skip()
})
```

will output:

```bash
    √ #someFunction() should always return true
```

### t.test(...).only()

Eltro supports exclusivity when running tests. When specified, only tests marked with only will be run.

You can do exclusivity on tests by adding `.only()` after or before the test like so:

```node
t.test('Only run this test', function() {
  assert.strictEqual(true, true)
}).only()
```

or like so:

```node
t.only().test('Only run this test', function() {
  assert.strictEqual(true, true)
})
```

### t.test(...).skip()

You can skip tests easily by adding `.skip()` before or after the test like so:

```node
t.test('Skip due to something being broken', function() {
  BrokenFunction()
}).skip()
```

or like so:

```node
t.skip().test('Skip this', function() { ... })
```

### t.test(...).timeout(dur)

Tests can take a long time. By default, eltro will cancel a test if it takes longer than 2 seconds. You can however override this by calling the timeout function after or before the test with the specified duration in milliseconds like so:

```node
t.test('This is a really long test', async function() {
  await DoSomethingForReallyLongTime()
}).timeout(5000) // 5 seconds
```

or like so:

```node
t.timeout(5000).test('A long test', async function() { ... })
```
