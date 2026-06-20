// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

let _ = require('lodash')
const path = require('path');
const os = require('os');

// OPTIONS [

function getOptions(home, llog, dirs) {
    // todo: refactor

    var HOME = home.split(':')[0]

    var options = {
        ws_port: 8077,
        debug: 1,
        common: {
            ignore: [
            '.git',
            '.git/**',
            /^test\/.*/,
            'node_modules',
            'node_modules/**',
            'node_modules/**/.*',
            'node_modules/**/.*/**',
            '*.swp'
        //        /\/node_modules.*/
            ]
        },
        paths: {
        },
        
        gitignorepaths: [
        //    HOME+'afilter',
        //    HOME+'build',
            HOME+'/amedia'
        ],
        
        logpath: llog,
        
        mediastorage: {
            commonpath: HOME+'/amedia/media',
            filesflags: {5400: "donwloadonly"} // remove?
        },
        
        mediatypes: [
            'default',
            'image',
            'sound',
            'font',
            'data',
            'video'
        ],
        
        mediapermissions: {
            '*': "up down",
            'video/5400': 'down',
            'image/8020': 'down', // range 8001-9000 down ???
            'image/15000': 'down',
//            'image/198109': 'up ondemand',
            'data/16000': 'down',
            'sound/1': 'up ondemand',
            'sound/2': 'up ondemand',
            'sound/55': 'up ondemand',
            'sound/11': 'up ondemand',
            'video/5500': 'up ondemand'
        }
        
    }
        
    options.HOME = HOME
    options.LLOG = llog

    options.paths[options.mediastorage.commonpath] = {}

    // NO_UPLOAD [

    function noUpload(type, start, end) {
        for (var i = start; i < end; i++) {
            var p = type + '/' + i
            var o = {}
            o[p] = 'down'
            options["mediapermissions"][p] = 'down'
        }
    }

//    noUpload('image', 8001, 9000)
//    noUpload('image', 16000, 16001)

    // NO_UPLOAD ]
    
    // Set paths

    options.setPaths = function setPaths(home, dirs) {
        _.each(dirs, (dir)=>{
            options.paths[`${home}/${dir}/`] = {}
        })
    }

    // Set home / subdirs
    options.setPaths(HOME, dirs)
 
    function pathExpand(p) {
        return path.resolve(p.replace('~', os.homedir()));
    }
    
    // Set extra paths
    for (const p of home.split(':')) {
        if (p != HOME) {
            
            options.paths[`${pathExpand(p)}/`] = {}
        }
    }
    
    return options
}

// OPTIONS ]

module.exports = {
    getOptions
}
