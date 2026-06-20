// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

var bonjourNode = require('bonjour')()

class Peer {
    constructor () {

    }

    startMacBonjour (options) {
        var BIN = options.BonjourNotifier
        var util = require('../util')
        util.shspawn(`${BIN} local. _acpuserver._tcp ${options.ws_port}`)
    }

    start (options) {
        // START BONJOUR - disabled [
        
        return
        
        // START BONJOUR - disabled ]

        this.startMacBonjour(options)


        bonjourNode.publish({ name: 'acpu-node-peer', type: 'http', port: options.ws_port })

        this.listen()
    }

    listen () {
        bonjourNode.find({ type: 'http' }, function (service) {
            console.log('Found an HTTP server:', service)
        })
    }
}

module.exports = Peer
