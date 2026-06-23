// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

const path = require('path');
const os = require('os');

require('dotenv').config();

function pathExpand(p) {
//    console.log(p)
    return path.resolve(p.replace('~', os.homedir()));
}

console.log(`BASE ENV ${process.env.BASE}`)
BASE=pathExpand(process.env.BASE)

BASE_SOURCES=''
if (process.env.BASE_SOURCES) {
    console.log(`BASE_SOURCES ENV ${BASE_SOURCES}`);
    BASE_SOURCES=pathExpand(process.env.BASE_SOURCES)
}

console.log(`BASE ${BASE}`);
console.log(`BASE_SOURCES ${BASE_SOURCES}`);

var HOME0 = BASE.split(':')[0]

//let HOME = `${HOME0}/`
let LLOG = `${HOME0}/log/`

// V0 PATH [
//let HOME = `${BASE}/acpul-project/`
//let LLOG = `${BASE}/acpul-project/log/`
// V0 PATH ]

let options = require('./base0').getOptions(BASE, LLOG, ['acpul-demo', 'acpul-os'])

// disable download video
options.mediapermissions['video/5400'] = {op: 'down', min: 10977}
options.mediapermissions['image/15000'] = {op: 'down', min: 9137}
//options.mediapermissions['video/5400'] = '-'
//options.mediapermissions['image/15000'] = '-'

console.log(options)

// Source code

//options.SOURCES = BASE_SOURCES

// Bonjour

// old
//options.BonjourNotifier = 'BonjourNotifier'

module.exports = options
