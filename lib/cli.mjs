import path from 'path'
import fs from 'fs'

export function CLI(e) {
  this.e = e
  this.reporter = 'list'
  this.targets = ['test/**']
  this.files = []
  this.errored = false
}

CLI.prototype.parseOptions = function(args) {
  if (!args || !args.length) {
    this.targets.push('test/**')
    this.errored = false
    return
  }

  this.errored = false
  this.targets.splice(0, this.targets.length)


  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-r' || args[i] === '--reporter') {
      if (!args[i + 1] || (args[i + 1] !== 'list' && args[i + 1] !== 'dot')) {
        this.errored = true
        return
      }
      this.reporter = args[i + 1]
      i++
    } else {
      this.targets.push(args[i])
    }
  }

  if (!this.targets.length) {
    this.targets.push('test/**')
  }
}

CLI.prototype.processTargets = function() {
  this.files.splice(0, this.files.length)

  if (!this.targets.length) {
    return Promise.resolve()
  }

  return Promise.all(this.targets.map((target) => {
    return getFiles(this.files, target)
  })).then(() => {
    if (!this.files.length) {
      this.errored = 'empty'
    }
  })
}

CLI.prototype.loadFiles = async function() {
  let cwd = process.cwd()

  for (let i = 0; i < this.files.length; i++) {
    if (this.files[i].endsWith('.mjs') || this.files[i].endsWith('.js')) {
      this.e.setFilename(this.files[i])
      await import('file:///' + path.join(cwd, this.files[i]))
      this.e.resetFilename()
    }
  }
}

function traverseFolder(files, curr, match, insidePath, grabAll, insideStar, includeFiles) {
  return new Promise(function(resolve, reject) {
    return fs.readdir(curr, function(err, data) {
      if (err) return reject(new Error('unable to read directory ' + curr + ': ' + err.message))

      resolve(Promise.all(data.map(function(file) {
        return new Promise(function(res, rej) {
          fs.lstat(path.join(curr, file), function(err, stat) {
            if (err) return rej(new Error('unable to read file or directory ' + path.join(curr, file) + ': ' + err.message))

            if ((includeFiles || grabAll) && stat.isFile()) {
              if (!match || fileMatches(file, match)) {
                files.push(path.join(insidePath, file).replace(/\\/g, '/'))
                return res(files)
              }
            }
            if (stat.isDirectory() && grabAll) {
              return res(traverseFolder(files, path.join(curr, file), match, path.join(insidePath, file), grabAll, insideStar, includeFiles))
            } else if (stat.isDirectory() && match) {
              return res(getFiles(files, match, path.join(insidePath, file), grabAll, insideStar))
            }
            res(null)
          })
        })
      })).then(function() { return files }))
    })
  })
}

export function fileMatches(filename, match) {
  return Boolean(filename.match(new RegExp(match.replace(/\./, '\\.').replace(/\*/, '.*'))))
}

export function getFiles(files, match, insidePath, grabAll, insideStar) {
  let isGrabbingAll = grabAll || false
  let isStarred = insideStar || false
  let cwd = process.cwd()
  let currPath = insidePath || ''
  let curr = path.join(cwd, currPath || '')

  return new Promise(function(res, rej) {
    let start = 0
    let splitted = match.split('/')
    if (splitted[start] === '.') {
      start++
    }
    if (splitted[splitted.length - 1] === '') {
      splitted[splitted.length - 1] === '*'
    }

    let first = splitted[start]

    if (splitted.length > start + 1) {
      if (first === '**') {
        isGrabbingAll = isStarred = true
        return traverseFolder(files, curr, splitted.slice(start + 1).join('/'), currPath, isGrabbingAll, isStarred, false)
          .then(res, rej)
      } else if (first === '*') {
        isStarred = true
        return traverseFolder(files, curr, splitted.slice(start + 1).join('/'), currPath, isGrabbingAll, isStarred, false)
          .then(res, rej)
      }
      return getFiles(files, splitted.slice(start + 1).join('/'), path.join(currPath, first), grabAll, isStarred)
        .then(res, rej)
    } else if (first.indexOf('*') >= 0) {
      if (first === '**') {
        isGrabbingAll = isStarred = true
      }
      return traverseFolder(files, curr, first === '*' || first === '**'? '' : first, currPath, isGrabbingAll, isStarred, true)
        .then(res, rej)
    }

    fs.lstat(path.join(curr, first), function(err, stat) {
      if (err) {
        // If we're inside a star, we ignore files we cannot find
        if (isStarred) {
          return res(files)
        }
        return rej(new Error('file ' + path.join(insidePath, first) + ' could not be found: ' + err.message))
      }
      
      if (stat.isDirectory()) {
        return traverseFolder(files, path.join(curr, first), '', path.join(currPath, first), true, true, true)
          .then(res, rej)
      }

      files.push(path.join(currPath, match).replace(/\\/g, '/'))
      return res(files)
    })
  })
}

export function printError(err, msg) {
  let before = msg || ''
  console.error('')
  console.error('\x1b[31m    '
        + before + err.toString()
        + '\x1b[0m\n    \x1b[90m'
        + err.stack.replace(err.toString(), ''))
  console.error('\x1b[0m')
}
