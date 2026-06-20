// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

var _ = require('underscore')
var DataObject = require('./DataObject'),
  fs = require('fs')

require('./util').extend(this)

// DataFile [

var DataFile = function (options) {
  if (!(this instanceof DataFile))
    return new DataFile(options)

  this.path = options.path || ''
  this.objects = []
  this.objectsHash = {}
}

DataFile.prototype.clone = function () {
  var f = new DataFile({
    path: this.path
  })

  f.objects = _.clone(this.objects)
  f.objectsHash = _.clone(this.objectsHash)
  return f
}

DataFile.prototype.addObject = function (options) {
  var o = new DataObject({
    id: options.id,
    name: options.name,
    path: this.path
  })

  this.updateObject(undefined, o)

  return o
}

DataFile.prototype.updateObject = function (after, o) {
  var i = this.objects.getIndexBy('id', o.id)
  if (i >= 0)
    this.objects[i] = o
  else {
    var j
    if (after)
      j = this.objects.getIndexBy('id', after.id)
    if (j >= 0)
      this.objects.insert(j+1, o)
    else
      this.objects.push(o)
  }
  this.objectsHash[o.id] = o
}

DataFile.prototype.deleteObject = function (o) {
  var i = this.objects.getIndexBy('id', o.id)
  if (i >= 0) {
    this.objects.splice(i, 1)
    delete this.objectsHash[o.id]
  }
}

DataFile.prototype.save = function () {
  var text = ''
  _.each(this.objects, function (o, i) {
    if (i > 0)
      text += '\n'
    // is auto id?
    if (o.id.indexOf('~!@@') != 0)
      text += '### '+o.id+' '+o.name+'\n'
    else
      text += '### '+o.name+'\n'
    text += o.lines.join('\n')
  })
  fs.writeFileSync(this.path, text)
  console.log('wrote', this.path)
}

// DataFile ]

module.exports = DataFile
