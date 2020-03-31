import { Casette as c, assert} from '../index.mjs'

c.describe('Array', function() {
  c.describe('#indexOf()', function() {
    c.test('should return -1 when value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1)
    })
  })
})
