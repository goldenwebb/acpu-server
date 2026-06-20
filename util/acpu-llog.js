// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

// LiveLogging [

function liveLoggingStart(opts) {
  var LiveLogging = require('livelogging')

  var options = {
    logToConsole: false,
    port: 8995,
    commentPrefix: '#',
    flushMessagesCount: 10000,
    queueMessagesMax: 10000,
    dataFileFlushQueueMessagesMax: 10000
  }
  options.datafile = opts.LLOG+"/acpu-server-log.sh"

  LiveLogging.server(options)

  var livelog = LiveLogging.log

  livelog('acpu-server/Status', LiveLogging.status())
//  livelog('LiveLogging/Config', LiveLogging.config())

  //mediaStorage.setLiveLogging(LiveLogging)
}

// LiveLogging ]

module.exports = {
  start: liveLoggingStart
}
