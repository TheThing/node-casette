import e from '../lib/eltro.mjs'
import assert from '../lib/assert.mjs'
import { CLI, getFiles, fileMatches } from '../lib/cli.mjs'

e.describe('CLI', function() {
  let cli = new CLI()

  e.test('#constructor() give default options', function() {
    assert.strictEqual(cli.reporter, 'list')
    assert.deepEqual(cli.targets, ['test/**'])
    assert.deepEqual(cli.files, [])
    assert.notOk(cli.errored)
  })

  /*****************************************
   * #parseOptions()
   *****************************************/

  e.describe('#parseOptions()', function() {
    e.test('should not do anything if no options', function() {
      cli.reporter = 'list'
      cli.parseOptions([])
      assert.strictEqual(cli.reporter, 'list')
      assert.notOk(cli.errored)
    })

    e.test('should support overriding reporter with shorthand option', function() {
      cli.reporter = 'list'
      cli.parseOptions(['-r', 'dot'])
      assert.strictEqual(cli.reporter, 'dot')
      assert.notOk(cli.errored)
    })

    e.test('should support overriding reporter with long option', function() {
      cli.reporter = 'list'
      cli.parseOptions(['--reporter', 'dot'])
      assert.strictEqual(cli.reporter, 'dot')
      assert.notOk(cli.errored)
    })

    e.test('should support reporter list', function() {
      cli.reporter = 'list'
      cli.parseOptions(['-r', 'list'])
      assert.strictEqual(cli.reporter, 'list')
      assert.notOk(cli.errored)
    })

    e.test('should mark errored if missing reporter', function() {
      cli.parseOptions(['--reporter'])
      assert.ok(cli.errored)
    })

    e.test('should mark errored if invalid reporter', function() {
      cli.parseOptions(['--reporter', 'test'])
      assert.ok(cli.errored)
    })

    e.test('should add file to targets', function() {
      cli.parseOptions(['test'])
      assert.deepEqual(cli.targets, ['test'])
      assert.notOk(cli.errored)
    })

    e.test('should add file to targets no matter where it is', function() {
      cli.parseOptions(['test', '-r', 'list', 'test2'])
      assert.deepEqual(cli.targets, ['test', 'test2'])
      assert.notOk(cli.errored)
    })

    e.test('should default add test to target if no target', function() {
      cli.parseOptions(['-r', 'list'])
      assert.deepEqual(cli.targets, ['test/**'])
      assert.notOk(cli.errored)
    })
  })

  /*****************************************
   * #processTargets()
   *****************************************/

  e.describe('#processTargets()', function() {
    e.test('should mark errored if empty', async function() {
      cli.targets = ['test/folder1/*.txt']
      await cli.processTargets()
    
      assert.strictEqual(cli.files.length, 0)
      assert.ok(cli.errored)
    })

    e.test('should support direct file path if exists', async function() {
      cli.targets = ['test/folder1/sampletest1.temp.mjs']
      await cli.processTargets()
    
      assert.strictEqual(cli.files.length, 1)
      assert.strictEqual(cli.files[0], 'test/folder1/sampletest1.temp.mjs')
    })
    
    e.test('should return all files in a directory', async function() {
      cli.targets = ['test/folder1/']
      await cli.processTargets()
    
      assert.strictEqual(cli.files.length, 2)
      assert.strictEqual(cli.files[0], 'test/folder1/sampletest1.temp.mjs')
      assert.strictEqual(cli.files[1], 'test/folder1/sampletest2.temp.mjs')
    })
    
    e.test('should support start as folder substitute', async function() {
      cli.targets = ['*/folder1/']
      await cli.processTargets()
    
      assert.strictEqual(cli.files.length, 2)
      assert.strictEqual(cli.files[0], 'test/folder1/sampletest1.temp.mjs')
      assert.strictEqual(cli.files[1], 'test/folder1/sampletest2.temp.mjs')
    })
    
    e.test('should support grabbing only files in folder', async function() {
      cli.targets = ['test/*']
      await cli.processTargets()
    
      assert.ok(cli.files.length)
      for (let i = 0; i < cli.files.length; i++) {
        assert.notOk(cli.files[i].match(/\/folder1\//))
        assert.notOk(cli.files[i].match(/\/folder2\//))
      }
    })
    
    e.test('should support grabbing only pattern files in folder', async function() {
      cli.targets = ['test/*.test.mjs']
      await cli.processTargets()
    
      assert.ok(cli.files.length)
      for (let i = 0; i < cli.files.length; i++) {
        assert.notOk(cli.files[i].match(/\/folder1\//))
        assert.notOk(cli.files[i].match(/\/folder2\//))
      }
    })
    
    e.test('should support multiple star pattern', async function() {
      cli.targets = ['test/*/*.mjs']
      await cli.processTargets()
    
      assert.strictEqual(cli.files.length, 4)
      cli.files.sort()
      assert.deepEqual(cli.files, [
        'test/folder1/sampletest1.temp.mjs',
        'test/folder1/sampletest2.temp.mjs',
        'test/folder2/sampletest3.temp.mjs',
        'test/folder2/sampletest4.temp.mjs',
      ])
    
      cli.targets = ['test/*/sampletest*.mjs']
      await cli.processTargets()
    
      assert.strictEqual(cli.files.length, 4)
      cli.files.sort()
      assert.deepEqual(cli.files, [
        'test/folder1/sampletest1.temp.mjs',
        'test/folder1/sampletest2.temp.mjs',
        'test/folder2/sampletest3.temp.mjs',
        'test/folder2/sampletest4.temp.mjs',
      ])
    })
    
    e.test('should support double star pattern', async function() {
      cli.targets = ['test/**/*.mjs']
      await cli.processTargets()
    
      assert.ok(cli.files.length)
    
      let found = {
        sampletest1: false,
        sampletest2: false,
        sampletest3: false,
        sampletest4: false,
        sampletest5: false,
        cli: false
      }
    
      for (let i = 0; i < cli.files.length; i++) {
        if (cli.files[i] === 'test/folder1/sampletest1.temp.mjs') {
          found.sampletest1 = true
        }
        if (cli.files[i] === 'test/folder1/sampletest2.temp.mjs') {
          found.sampletest2 = true
        }
        if (cli.files[i] === 'test/folder2/sampletest3.temp.mjs') {
          found.sampletest3 = true
        }
        if (cli.files[i] === 'test/folder2/sampletest4.temp.mjs') {
          found.sampletest4 = true
        }
        if (cli.files[i] === 'test/folder2/sampletest5.temp.txt') {
          found.sampletest5 = true
        }
        if (cli.files[i] === 'test/cli.test.mjs') {
          found.cli = true
        }
      }
    
      assert.deepEqual(found, {
        sampletest1: true,
        sampletest2: true,
        sampletest3: true,
        sampletest4: true,
        sampletest5: false,
        cli: true
      })
    })
    
    e.test('should support double star pattern end', async function() {
      cli.targets = ['test/**']
      await cli.processTargets()
    
      assert.ok(cli.files.length)
    
      let found = {
        sampletest1: false,
        sampletest2: false,
        sampletest3: false,
        sampletest4: false,
        sampletest5: false,
        cli: false
      }
    
      for (let i = 0; i < cli.files.length; i++) {
        if (cli.files[i] === 'test/folder1/sampletest1.temp.mjs') {
          found.sampletest1 = true
        }
        if (cli.files[i] === 'test/folder1/sampletest2.temp.mjs') {
          found.sampletest2 = true
        }
        if (cli.files[i] === 'test/folder2/sampletest3.temp.mjs') {
          found.sampletest3 = true
        }
        if (cli.files[i] === 'test/folder2/sampletest4.temp.mjs') {
          found.sampletest4 = true
        }
        if (cli.files[i] === 'test/folder2/sampletest5.temp.txt') {
          found.sampletest5 = true
        }
        if (cli.files[i] === 'test/cli.test.mjs') {
          found.cli = true
        }
      }
    
      assert.deepEqual(found, {
        sampletest1: true,
        sampletest2: true,
        sampletest3: true,
        sampletest4: true,
        sampletest5: true,
        cli: true
      })
    })
  })  
})

e.test('#fileMatches() should support filename matching with glob pattern', async function() {
  assert.ok(fileMatches('bla.test.mjs', '*.mjs'))
  assert.ok(fileMatches('bla.test.mjs', '*test.mjs'))
  assert.ok(fileMatches('bla.test.mjs', 'bla*.mjs'))
  assert.notOk(fileMatches('bla.test.mjs', 'bla*.js'))
  assert.notOk(fileMatches('bla.test.mjs', '*.js'))
  assert.notOk(fileMatches('bla.test.mjs', 'blas*.js'))
})
