// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

// LIB GIT [
var sys = require('sys')
//var execSync = require('exec-sync');
var exec = require('child_process').exec;
//var sh = require('exec-sync')
var _ = require('underscore')

var gitSyncTimer;
var gitSyncDirQueue = {};
var gitReady = true;

var addFile = function addFile(options, path) {
  // .gitignorepaths [

  var p = _.find(options.gitignorepaths, function (p) {
    if (path.indexOf(p) === 0)
      return true
  })
  if (p) {
    console.log('git changes is ignored')
    return
  }

  // .gitignorepaths ]
  // select syncDir [

  var syncDir
  for (var p in options.paths) {
    var s = typeof p == "string" ? p : key
//    s = s.replace('//', '/')
    s = s.replace(/([^:])(\/\/+)/g, '$1/');
    if (path.indexOf(s) === 0) {
      syncDir = s
      break
    }
  }
  if (!syncDir)
    return

  // select syncDir ]

  function gitError(code) {
    console.log('git exit code ', code)
  }

  function puts(error, stdout, stderr) {
    if (stdout != '')
      console.log(stdout)
    if (stderr != '')
      console.log(stderr)
  }

  // git sync [

  function stopGitTimer() {
    if (gitSyncTimer) {
      clearInterval(gitSyncTimer)
      gitSyncTimer = undefined
    }
  }
  stopGitTimer()

  gitSyncDirQueue[syncDir] = true

  startGitTimer()

  queueIndex = 0

  function gitSyncFn() {
    if (gitReady) {
      gitReady = false
      stopGitTimer()

      if (gitSyncDirQueue.length == 0)
        return

      let paths = Object.keys(gitSyncDirQueue)
      if (queueIndex >= paths.length)
        queueIndex = 0
      
      var path = paths[queueIndex]
      queueIndex += 1

//      var path = Object.keys(gitSyncDirQueue)[0]
//      delete gitSyncDirQueue[path]

//      console.log('gitsync', path)

      exec(`./gitsync.sh ${path} 1`, {
        cwd: __dirname
      }, puts)
        .on('exit', function (code) {
          gitReady = true
          if (Object.keys(gitSyncDirQueue).length > 0)
            startGitTimer()

          if (code !== 0)
            return gitError(code)
        })
    }
  }

  function startGitTimer() {
    if (!gitSyncTimer) {
      gitSyncTimer = setInterval(gitSyncFn, 100)
    }
  }

  // git sync ]
}

// LIB GIT ]

module.exports = {
  addFile: addFile
}