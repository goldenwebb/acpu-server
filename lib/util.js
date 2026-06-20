// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

module.exports = {extend: function (v) { 

(function () {
	
// LIB ARRAY [

Array.prototype.getIndexBy = function (name, value) {
  for (var i = 0; i < this.length; i++) {
    if (this[i][name] == value) {
      return i;
    }
  }
}

Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};

// LIB ARRAY ]
// LIB STRING [

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, "")
}

// LIB STRING ]

}).call(v)
},

// LIB SYS [

  shspawn: function(...command) {
    var spawn = require('child_process').spawn
    function shspawn(command) {
//      var a = ['-c', ...command]
      var res = spawn('sh', ['-c', ...command], { stdio: 'inherit' })
//      console.log('spawn', res)
    }
    return shspawn(command)
  }

// LIB SYS ]

}