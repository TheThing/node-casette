#!/usr/bin/env node

// Get arguments
const [,, ...args] = process.argv

import e from './lib/eltro.mjs'
import { CLI, printError } from './lib/cli.mjs'

e.begin()

const cli = new CLI(c)
cli.parseOptions(args)

if (cli.errored) {
  PrintHelp()
}

function PrintHelp() {
  console.log('')
  console.log('Usage: eltro <options> <files>')
  console.log('')
  console.log('where <files> can either be a single file or a simple glob pattern.')
  console.log('where <options> can be any of the following:')
  console.log('  -r, --reporter - Specify the reporter to use.')
  console.log('      Supported reporters: list, dot')
  console.log('')
  console.log('eltro test/mytest.mjs')
  console.log('eltro dot test/*.mjs')
  console.log('eltro -r dot test/**/*.test.mjs')
  process.exit(1)
}

cli.processTargets().then(function() {
  if (!cli.files.length) {
    console.log('')
    console.log('No files were found with pattern', cli.targets.join(','))
    PrintHelp()
  }
  return cli.loadFiles()
    .then(function() {
      e.reporter = cli.reporter

      return e.run()
        .catch(function(err) {
          console.log('')
          console.error('\x1b[31mUnknown error occured while running the tests\x1b[0m')
          printError(err)
          process.exit(1)
        })
    }, function(err) {
      console.log('')
      console.error('\x1b[31mUnknown error while opening files\x1b[0m')
      printError(err)
      process.exit(1)
    })
}, function(err) {
  console.log('')
  console.error('\x1b[31mUnknown error while processing arguments\x1b[0m')
  printError(err)
  process.exit(1)
})
.then(function() {
  process.exit(0)
})
