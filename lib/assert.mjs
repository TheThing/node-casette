import assert from 'assert'
import util from 'util'

const fail = assert.fail;

function truncate(s, n) {
  return s.length < n ? s : s.slice(0, n) + '...';
}

function stringifyObject(data) {
  if (typeof(data) !== 'string') {
    data = util.inspect(
        data,
        { depth: 1 }
      )
      .replace(/\n /g, '');
  }
  return truncate(data, 64);
}

assert.notOk = (value, message) => {
  if (Boolean(value)) {
    assert.equal(value, false, message)
  }
}

assert.match = (value, test, message) => {
  let result = value.match(test);
  if (result) return;

  let m = message
  if (!m) {
    m = `${value} did not match ${test}`
  }

  fail(m);
}

assert.notMatch = (value, test, message) => {
  let result = value.match(test);
  if (!result) return;

  let m = message
  if (!m) {
    m = `${value} matched ${test}`
  }

  fail(m);
}

assert.isFulfilled = (promise, message) => {
  return Promise.resolve(true)
    .then(() => promise)
    .catch((err) => {
      let m = message
      if (!m) {
        m = `promise failed with ${err.message || stringifyObject(err)}`;
      }
      fail(m);
    });
}

assert.isRejected = (promise, message) => {
  let hasFailed = false;

  return Promise.resolve(true)
    .then(() => promise)
    .catch((data) => {
      hasFailed = true;
      return data;
    })
    .then((data) => {
      if (hasFailed) return data;
      let m = message
      if (!m) {
        m = `promise was fulfilled with ${stringifyObject(data)}`;
      }

      fail(m);
    });
}

export default assert
