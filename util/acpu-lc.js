// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

// LiveComment [

let options = require('../config/config')



function liveCommentStart(options) {
  var SRC = options.SOURCE
  var LLOG = options.LLOG
  var ACPU_PROJECT = `${options.BASE}/acpul-project/`

  var spawn = require('child_process').spawn;
  function shspawn(command) {
    spawn('sh', ['-c', command], { stdio: 'inherit' });
  }
    
  // LLog [

  var cmd = "node_modules/livecomment/bin/livecomment --port 8455 --ws_port 8996 --fileProcessDelay 3000 --ignore '\.git\/' --path "+LLOG+" --dangerousCodeExecutionClient --dangerousCodeExecutionServer --debug 1 --log=watch.skip,watch.scan"

  shspawn(cmd)

  // LLog ]
}
    
// LiveComment ]

module.exports = {
  start: liveCommentStart
}
