// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

var scanwatch = require('scanwatch')
var fs = require('fs')
var _ = require('underscore')

var newFilePath;

var DataFactory = require('./DataFactory')
var MediaStorage = require('./MediaStorage')

var options

var dataFactory
var mediaStorage

// start [

function start(opts) {
	options = opts

	setup_data()
	start_server_ws()
	startup()
}

// start ]
// WS SERVER [

var wss

function start_server_ws() {

	console.log("✔ ws server listening on port %d", options.ws_port);

	var WebSocketServer = require('ws').Server
	wss = new WebSocketServer({port: options.ws_port});

	wss.on('error', (err) => {
		console.error('wss', err)
	});

	wss.on('disconnect', (ws) => {
		mediaStorage.stopSending()
	})

	wss.on('connection', function(ws) {

	  // CLIENT CONNECTED [

	  console.log('client connected');

	  mediaStorage.clientConnected(ws)

	  var logMessages = []
	  var logTimer

	  ws.on('error', (err) => {
		console.error('ws', err)
	  });

	  // recv [
	  ws.on('message', function(message) {

	    var m
	    try {
	      m = JSON.parse(message)
	      if (m.cmd === 'queryobjects')
	      {
	        // queryobjects [

	        ws.acpuDeviceId = m.deviceId
	        console.log(m.cmd, _.size(m.objects), 'objects')
	        console.log(m.objects)
	        var objects = dataFactory.queryObjects(m)
	        var files = dataFactory.queryFiles(options)

			// SYNC_MODE JOIN - no delete objects [

			if (options.sync_mode == 'JOIN') {
				let selected = {}
				for (let key in objects) {
					let o = objects[key]
					if (o.status != 'deleted') {
						selected[key] = o
					}
				}
				objects = selected
			}

			// SYNC_MODE JOIN - no delete objects ]

	        var res = {
	          'cmd': 'apply',
	          'objects': objects,
			  'files': files
	        }
			console.log('send objects')
//	        console.log('send', res)
	        res = JSON.stringify(res)
	        ws.send(res)

	        // queryobjects ]
	      }
	      else if (m.cmd == 'apply')
	      {
	        // apply [
	        if (m.id) {
	          m.objects = {}
	          m.objects[m.id] = {
	            status: 'changed',
	            data: {
	              id: m.id,
	              name: m.name,
	              code: m.code
	            }
	          }
	        }
	        console.log(m.cmd, m.id || m.objects)
	        dataFactory.updateObjects(m, {sender: ws, saveFile:true})
	        // apply ]
	      }
	      else if (m.cmd == '_data')
	      {
	        processData(wss, ws, m)
	      }
	      else if (m.cmd == 'log')
	      {
	        // todo: logname per device UUID [

	        function logString(filename, s) {
	          fs.appendFileSync(filename, s+'\n')/*, function (err) {
	            if (err) {
	              console.log("Error: can't write log", filename)
	            }
	          });*/
	        }
	        function flushMessages(n) {
	          var messages = logMessages.slice(0, n)
	          logMessages = logMessages.slice(n)
	          var messages = _.sortBy(messages, 'time')
	//          console.log(messages);
	          _.each(messages, function (m) {
	            var filename = options.logpath+'/1.log'
	            logString(filename, m.text)
	          })
	        }
	        logMessages.push(m)
	        if (logMessages.length > 50)
	          flushMessages(25)

	        if (logTimer)
	          clearTimeout(logTimer)
	        logTimer = setTimeout(function () {
	          logTimer = null
	          flushMessages(logMessages.length)
	        }, 500)

	//        console.log(m.text);

	        // todo: logname per device UUID ]
	      }
		  else if (m.cmd == 'requestFile') {
			if (m.name != 'font/1000/0/0') // disable log
				console.log('requestFile', m.name)
			mediaStorage.requestFile(wss, ws, m.name)
		  }
	      else if (m.cmd == 'streamBootstrap') {
	        mediaStorage.bootstrap(wss, ws, m)
	      }
	      else if (m.cmd == 'streamWrite') {
	        mediaStorage.write(wss, ws, m)
	        // send sync pong [
	        // send sync pong ]
	      }
		  else if (m.cmd == 'chunkApprove') {
			mediaStorage.sendingChunkApprove(m)
		  }
	    } catch (e) {
	      console.log(e)
	    }
	//    console.log('received: %s', message);

	  })
	  // recv ]

	  ws.send('something');

	  var time = (new Date).toLocaleTimeString();
	  ws.send(JSON.stringify({'event': 'connected', 'time': time}));

	  // CLIENT CONNECTED ]

	});
}

// WS SERVER ]
// setup_data [

function setup_data() {

	newFilePath = Object.keys(options.paths)[0]

	dataFactory = new DataFactory(options)
	mediaStorage = new MediaStorage(options)

	// on object.event [

	dataFactory.on('object.event', function(type, options, o, extra) {
	  wss.clients.forEach(function (ws) {
	    if (options && options.sender == ws)
	      return

	    function sendObjects(objects) {
	      // copy-paste [
	      var res = {
	        'cmd': 'apply',
	        'objects': objects
	      }
	      console.log('send', res)
	      res = JSON.stringify(res)
	      ws.send(res)
	      // copy-paste ]
	    }
	    if (type == 'update' || type == 'new') {
	      var objects = {}
	      objects[o.id] = {
	        status: 'changed',
	        data: o.pack()
	      }
	      sendObjects(objects)
	    }
	    else if (type == 'delete') {
	      var objects = {}
	      objects[o.id] = {
	        status: 'deleted'
	      }
	      sendObjects(objects)
	    }
	  })
	})

	// on object.event ]
}

// setup_data ]
// startup [

function startup() {
  var pathP = require('path')
  scanwatch.setup(options, function fileChanged(type, path) {

//  var ext = pathP.extname(path)
//  if (ext !== '.acpul')
//    return

	// skip if not file: not found, dir or symlink
    if (type == 'skip' 
		|| !fs.existsSync(path) 
		|| fs.lstatSync(path).isDirectory()
		|| fs.lstatSync(path).isSymbolicLink()) {
	
//    	console.log('[skipping]', path)
      return
    }
//    console.log(type, path)

    if (mediaStorage.scanFile(type, path)) {
      return;
    }

    dataFactory.analyzeFile(path) //, {change_type: type}
  })
}

// startup ]

var net = {
  packets: [],
  packetsHash: {},
  frame: 0
}

// processData [
function processData(wss, ws, data) {
//  console.log(data)
  // started --> send (SETUP, i) [
  if (data.signal === 'started') {
    var i = 0
	wss.clients.forEach(function (ws) {

      net.packets = []
      net.packetsHash = {}
      net.frame = 0

      // copy-paste [
      var res = {
        cmd: '_data',
        signal: 'setup',
        index: i
      }
      console.log(`send`, res)
      res = JSON.stringify(res)
      ws.send(res)
	  i += 1
      // copy-paste ]
    })
  }
  // started --> send (SETUP, i) ]

  // send --> merge(obj) ?-> send (SYNC, frame, i) [
  if (data.signal === 'send') {
    var frame = data.frame
    var i = data.index

/*    if (frame != net.frame)
      console.log('NETERR: bad frame', frame, net.frame)
    var max = wss.clients.length
    if (i < 0 || i >= max) {
      console.log('NETERR: index out of range', i, max)
      return
    }*/
    if (net.packetsHash[i]) {
//      console.log('NETERR: packet already exists', i)
//      return
    }

    var max = wss.clients.size

	net.packets[i] = data
    net.packetsHash[i] = data

    // all packets is ready [
    if (_.size(net.packetsHash) == max) {
		// EXTRACT DATA [
		var outputs
		var index = -1
		try {
			outputs = _.map(net.packets, function (p, i) {
				index = i
				return {
					index,
					data: p.data //net.packets //net.packets[i].data
				}
			})
		}
		catch (e) {
			console.error(e)
			console.log('net packets index', index);
			console.log('net packet', net.packets[index]);
			return
		}
		// EXTRACT DATA ]

      net.packets = []
      net.packetsHash = {}
      net.frame += 1

      wss.clients.forEach(function (ws) {
        // copy-paste [
        var res = {
          cmd: '_data',
          signal: 'sync',
          data: outputs
        }
//        console.log('send', res)
        res = JSON.stringify(res)
        ws.send(res)
        // copy-paste ]
      })

    }
    // all packets is ready ]
  }
  // send --> merge(obj) ?-> send (SYNC, frame, i) ]
}
// processData ]


module.exports = {
	start: start
}
