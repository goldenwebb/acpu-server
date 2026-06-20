// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

var _ = require('underscore')
var events = require('events');
var fs = require('fs')

var DataFile = require('./DataFile')

var gitadd;

// setup_git [

function setup_git(options) {
  // git sync [

  var gitsync = require("./gitsync")

  gitadd = function gitadd(path) {
    gitsync.addFile(options, path)
  }

  // git sync ]
}

// setup_git ]
// DataFactoryStructure [

var DataFactoryStructure = {
  files: {
    '=path=': '=file object='
  },
  '=file object=': {
    path: '=path=',
    objects: [
      '=data object='
    ],
    objectsHash: {
      id: '=data object='
    }
  },
  '=data object=': {
    path: '=path=',
    id: '0',
    name: 'name',
    code: 'code'
  },
  dataFilesHash: {
    'data object id': '=file object='
  },
  mode: 'startup'||'ready'
}

var dfs = {
  files: {},
  dataFilesHash: {},
  mode: 'startup'
}

// DataFactoryStructure ]
// DataFactory [

var DataFactory = function (options) {
  if (!(this instanceof DataFactory))
    return new DataFactory(options)

  events.EventEmitter.call(this); // no events

  setup_git(options)

  dfs.mode = 'startup'

  this.autoId = 0
  this.autoIdMap = {}
}

DataFactory.prototype.__proto__ = events.EventEmitter.prototype;

// get file [
DataFactory.prototype.getFile = function (path) {
  var file = dfs.files[path]
  if (file)
    return file

  // new file [
  file = new DataFile(path)
  file.path = path
  dfs.files[path] = file
  return file
  // new file ]
}

// get file ]
// get object [

DataFactory.prototype.getDataObject = function (id) {

}

// get object ]
// set file [

DataFactory.prototype.setFile = function (f, options) {
  var self = this

  // check dup's [
  var dups = []
  var dupsHash = {}
  _.each(f.objects, function (o) {
    var p1 = dfs.dataFilesHash[o.id]
    if (p1 && p1 != f.path) {
      var dup = {
        id: o.id,
        old: p1,
        new: f.path
      }
      dups.push(dup)
      dupsHash[dup.id] = dupsHash[dup.id] || []
      dupsHash[dup.id].push(dup)
    }
  })
  // check dup's ]

  // update data-file hash [
  _.each(f.objects, function (o) {
    var dups = dupsHash[o.id]
    if (!dups)
      dfs.dataFilesHash[o.id] = o.path
    else
      self.notifyObject('dup', options, o, dups)
  })
  // update data-file hash ]

  var updated = false
  // merge [
  if (!dfs.files[f.path])
  {
    // set new [
    dfs.files[f.path] = f
    updated = true
    // set new]
  }
  else
  {
    // update [

    var f1 = dfs.files[f.path]
    var dels = _.object(_.map(f1.objects, function (o) {
      return [o.id, o]
    }))

/*    var dels = _.reduce(f1.objects, function(o, v) {
      o[v.id] = v;
      console.log(o)
      return o;
    }, {});*/
//    console.log(dels)

    var prevObject
    _.each(f.objects, function (o) {
//      var i = dels.indexOf(o.id)
      if (dels[o.id])
        delete dels[o.id]

      var o1 = f1.objectsHash[o.id]
      if (o1)
      {
        // update
        if (!o.compare(o1)) {
          f1.updateObject(prevObject, o)
          self.notifyObject('update', options, o)
          updated = true
        }
      }
      else
      {
        // new
        f1.updateObject(prevObject, o)
        self.notifyObject('new', options, o)
        updated = true
      }
      prevObject = o
    })

    _.each(dels, function (o) {
      delete dfs.dataFilesHash[o.id];
      f1.deleteObject(o)
      self.notifyObject('delete', options, o)
      updated = true
    })

    // update ]

    f = f1
  }
  // merge ]

  if (updated && options && options.saveFile)
    f.save()
//  if (updated) {
  gitadd(f.path);
//  }
}

// events [

DataFactory.prototype.notifyObject = function (type, options, o, extra) {
  if (type == 'dup') {
    console.log(type, extra)
  } else {
    console.log(type, o.id, o.path)
  }
  this.emit('object.event', type, options, o, extra);
}

// events ]
// set file ]
// analyze file [

DataFactory.prototype.allocateFileId = function(path, name) {
  // hash is '/dir/file.acpul:object'
  var hash = path+':'+name
  var file = this.autoIdMap[hash]
  if (file)
    return file.id
  this.autoId++
  var id = '~!@@'+this.autoId
  this.autoIdMap[hash] = {
    id,
    hash,
    path,
    name
  }
  return id
}

DataFactory.prototype.analyzeFile = function (path, options) {
  var self = this
  var f = new DataFile({
    path: path
  })
  var fobj
  fs.readFileSync(path).toString().split('\n').forEach(function (line) {
    function check(line) {
      var o = {}
      line = line.trim()
//      line = '### a '
      if (line.indexOf('### ') === 0) { // comment
        var ss = line.split(' ')
        if (ss.length > 1) {
          o.id = ss[1]
          var tt = ss[1].split(':')
          o.type = (tt.length > 1) ? tt[1] : ''
          if (isNaN(Number(tt[0]))) {
            ss.splice(0, 1);
            o.name = ss.join(' ')
            o.id = self.allocateFileId(path, o.name)
          }
          else {
            ss.splice(0, 2);
            o.name = ss.join(' ')
          }
        }
        else
          return
        return o
      }
      return null
    }

    var o = check(line)
//    if (o && (!isNaN(o.id) || o.type === 'S')) {
    if (o) {
      console.log('add object ', o.id, o.type, o.name)
      fobj = f.addObject(o)
    } else {
      fobj && fobj.addLine(line)
    }
  })

  self.setFile(f, options)
}

// analyze file ]
// query objects [

DataFactory.prototype.queryObjects = function (options) {
  var diff = {}
  var news = _.clone(dfs.dataFilesHash)
  _.each(options.objects, function (o, k) {
//    console.log(o, k)

    var f = dfs.files[dfs.dataFilesHash[k]]
    if (!f) {
      diff[k] = {status:'deleted'}
    } else {
      if (news[k])
        delete news[k]
//      f.updateObject(undefined, o)
      var o1 = f.objectsHash[k]
      if (o1.md5() != o) {
        diff[k] = {
          status: 'changed',
          data: o1.pack()
        }
      }
    }
  })
  // map news [
  console.log('news:', Object.keys(news).length)
  _.each(news, function (p, k) {
    var f = dfs.files[dfs.dataFilesHash[k]]
    var o1 = f.objectsHash[k]
    diff[k] = {
      status: 'changed',
      data: o1.pack()
    }
//    console.log(k+':'+o1.name)
  })
  // map news ]
  return diff
}

// query objects ]
// query files [

DataFactory.prototype.queryFiles = function (options) {
  let files = []
  let PREFIX = options.HOME

  _.each(dfs.files, function (file, path) {
    _.each(file.objects, function (o, k) {
//      console.log(o, k)
      if (path.startsWith(PREFIX)) {
        path = path.slice(PREFIX.length);
      }
      
      files.push(path + '/' + o.id + ':' + o.name);
    })
  })
  return files
}

// query files ]
// update objects [

DataFactory.prototype.updateObjects = function (m, options) {
  var self = this

  _.each(m.objects, function (o, k) {
    // get file [
    var f0 = dfs.files[dfs.dataFilesHash[k]]
    var f
    if (!f0) {
      f = new DataFile({
        path: newFilePath+k+'.acpul'
      })
    } else {
      f = f0.clone()
    }
    // get file ]

    if (o.status == 'changed')
    {
      // changed [

      var o1 = f.addObject({
        id: k,
        name: o.data.name
      })
      var lines = o.data.code.split('\n')
      _.each(lines, function (line) {
        o1.addLine(line)
      })

      // changed ]
    }
    else if (o.status == 'deleted')
    {
      // deleted [
      console.log('client `deleted; is not implemented!')
      // deleted ]
    }

    // set file [
    self.setFile(f, options)
    // set file ]
  })
}

// update objects ]
// DataFactory ]

module.exports = DataFactory
