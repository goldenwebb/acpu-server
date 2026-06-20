// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

const 
  _ = require('underscore'),
  core = require('./lib/acpu-core'),
  mkdirp = require('mkdirp')

require('./lib/util').extend(this)

// core 

let options = require('./config/config')

mkdirp.sync(options.mediastorage.commonpath)
mkdirp.sync(options.logpath)

core.start(options)

// peer

var Peer = require('./lib/net/Peer')

var peer = new Peer()
peer.start(options)

// livecomment

var livecomment = require('./util/acpu-lc')

livecomment.start(options)

//var livecommentSources = require('./util/acpu-lc-sources')

//livecommentSources.start(options)


var livelog = require('./util/acpu-llog')

livelog.start(options)
