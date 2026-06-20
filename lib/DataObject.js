// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

var md5 = require('MD5');

// DataObject [

/*
var DataObject = Backbone.Model.extend({
  name: ''
})
*/

var DataObject = function (options) {
  if (!(this instanceof DataObject))
    return new DataObject(options)

  this.id = options.id
  this.name = options.name
  this.path = options.path || ''
  this.lines = []
}

DataObject.prototype.addLine = function (line) {
  this.lines.push(line)
}

DataObject.prototype.compare = function (o) {
  return this.md5() === o.md5() //JSON.stringify(this.lines) === JSON.stringify(o.lines)
}

DataObject.prototype.md5 = function () {
  var l = this.name + this.lines.join('\n')
  return md5(l)
}

DataObject.prototype.pack = function () {
  return {
    id: this.id,
    name: this.name,
    code: this.lines.join('\n')
  }
}

// DataObject ]

module.exports = DataObject
