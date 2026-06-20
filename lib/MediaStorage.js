// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

var mkdirp = require('mkdirp'),
  _ = require('underscore'),
  temp = require('temp'),
  fs = require('fs'),
  ppath = require('path'),
  ACPUNode = require('./ACPUNode'),
  mediaFileInfo = require('./MediaFileInfo')

temp.track();

var llog = {
  log: function(){},
  erase: function(){},
  replace: function(){}
}
var llprefix = ""

function MediaStorage(options) {

  // 'path/to/file/'media'/<type>/<pool>/<id>/<name>'
  //    image/0/0/1.png
  //    image/0/0/2.png
  //    sound/0/0/1_test.png
  // <name>: <id>_<meta>.<ext>


  // old
  this.mediaFiles = {
    // fid=<type>/<pool>/<id>/<name>
    // fid : {
    //  path
    //  duplicate
    // }

  }

  // new
  this.mediaFilesIID = {
    // iid=<type>/<pool>/<id>/<i>
    // iid : MediaFile
  }

  this.mediaFilesPaths = {
    // path : {file}
  }

  this.mediaFilesMaxNID = {
    // pid=<type>/<pool>/<id>
    // pid : maxNID
  }

  this.clients = {
    // id : {files:{fid:1}}
  }

  // TODO: replace clients
  this.nodes = {
    // ws : ACPUNode
  }

  this.downloads = {
    // name : {
    //  tmppath
    //  downloadSize
    //  prevoffset
    // }
  }

  this.permissions = options.mediapermissions

  this.commonpath = options.mediastorage.commonpath;

  this.mediatypes = options.mediatypes

  this.filesflags = options.mediastorage.filesflags

  // create dirs [

  // New stats
  this.stats = {
    acpuDeviceId: 'XXXXXX-XXXX-XXXX',
    acpuDeviceIdShort: 'XXXXXX',
    newFilesCount: 0,
    mediaFilesCount: 0
  }

  var self = this

  _.each(this.mediatypes, function (type) {
    var p = self.commonpath + '/' + type
    mkdirp(p, function (err) {
      if (err)
        console.log('MediaStorage', err)
    })
  })

  // create dirs ]
}

MediaStorage.prototype.extractMediaInfoFromPath = mediaFileInfo.extractMediaInfoFromPath
MediaStorage.prototype.extractMediaInfoFromPathEx = mediaFileInfo.extractMediaInfoFromPathEx
MediaStorage.prototype.extractMediaInfoFromFID = mediaFileInfo.extractMediaInfoFromFID
MediaStorage.prototype.checkMediaFile = mediaFileInfo.checkMediaFile
MediaStorage.prototype.FIDFromMediaInfo = mediaFileInfo.FIDFromMediaInfo
MediaStorage.prototype.PIDFromMediaInfo = mediaFileInfo.PIDFromMediaInfo
MediaStorage.prototype.PIDFromFID = mediaFileInfo.PIDFromFID
MediaStorage.prototype.extractFIDFromPath = mediaFileInfo.extractFIDFromPath
MediaStorage.prototype.extractPIDFromPath = mediaFileInfo.extractPIDFromPath

MediaStorage.prototype.allocateFID = function allocateFID(info) {
  var pid = mediaFileInfo.PIDFromMediaInfo(info)

  var maxNID = this.mediaFilesMaxNID[pid] || 0
  maxNID++
  this.mediaFilesMaxNID[pid] = maxNID

  info.nid = maxNID
  info.name = "" + maxNID + (info.suffix ? "_" + info.suffix : "") + "." + info.ext

  return info
}

MediaStorage.prototype.updateMaxNID = function updateMaxNID(pid, nid) {
  var maxNID = this.mediaFilesMaxNID[pid] || 0
  maxNID = (maxNID < nid) ? nid : maxNID
  this.mediaFilesMaxNID[pid] = maxNID
}

MediaStorage.prototype.addMediaFile = function addMediaFile(path) {
  if (!this.mediaFilesPaths[path]) {
    var info = mediaFileInfo.extractMediaInfoFromPath(path)
    var fid = mediaFileInfo.FIDFromMediaInfo(info)
    var pid = mediaFileInfo.PIDFromMediaInfo(info)
    this.updateMaxNID(pid, info.nid)

    var file = {
      fid: fid,
      path: path,
      duplicate: false
    }

    // new
    let iid = mediaFileInfo.IIDFromMediaInfo(info)
    this.mediaFilesIID[iid] = file

    this.mediaFiles[fid] = file
    this.mediaFilesPaths[path] = file
    return {file: file, isNew: true}
  }
  else {
    var file = this.mediaFilesPaths[path]
    if (file.path !== path) {
      file.duplicate = true
      console.log('ERROR: Duplicate media file, ignored:', path)
      return false
    }
    else {
      return {file: file, isNew: false}
    }
  }
}

//
// Check media permissions
//  permissions[typepool] == '*' any
//  permissions[typepool] == 'down' download only
//  permissions[typepool] == 'up' upload only
//  permissions[typepool] == 'down up' download and upload
//  permissions[typepool] == {op: 'down', min: 1000} download from 1000+ to split between servers
//

MediaStorage.prototype.checkPermissions = function checkPermissions(fid, mode) {
  var mediaInfo = mediaFileInfo.extractMediaInfoFromFID(fid)
//type: type, pool: pool, fid: fid, name: name, nid: n, ext: ext
  var typepool = mediaInfo.type + '/' + mediaInfo.pool

  var access = this.permissions[typepool]
  if (_.isUndefined(access)) {
    access = this.permissions['*'] || ''
  } else if (_.isString(access)) {
    // string pass
  } else if (_.isObject(access) && !_.isArray(access)) {
    // for op:'down', min: 1000

    if (access.min) {
      if (access.op == 'down') {
        if (mediaInfo.nid < 0) {
          console.log('New remote', fid)
        }
      }
      if (mediaInfo.nid >= 0 && mediaInfo.nid < access.min) {
        return false
      }
    }
    access = access.op
  }
  else {
    console.error('Wrong type', access)
    return false
  }
  //var access = this.permissions[typepool] || this.permissions['*'] || ''

//  console.log('access', access)
  return access.indexOf(mode) != -1
}

// CLIENT addNewFile [

MediaStorage.prototype.addNewFile = function addNewFile(client, fid) {
  if (!client.files[fid] && !client.newFiles[fid]) {
    if (this.checkPermissions(fid, 'up')) {
      if (this.checkPermissions(fid, 'ondemand')) {
        if (client.ondemand)
          return; 
      }
      client.newFiles[fid] = {}
    }
  }
}

MediaStorage.prototype.addNewFile2 = function addNewFile2(client, fid) {
  if (!client.files[fid] && !client.newFiles[fid]) {
    if (this.checkPermissions(fid, 'up')) {
      client.newFiles[fid] = {}
    }
  }
}

// CLIENT addNewFile ]

MediaStorage.prototype.updateMediaFile = function updateMediaFile(path) {
  var self = this

  var f = this.addMediaFile(path)
  if (!f)
    return

  // check clients for file [

  if (f.isNew) {
    var fid = f.file.fid
    _.each(this.clients, function (client) {

      // CLIENT newFileSync [

      self.addNewFile(client, fid)
      self.clientCheckNewFiles(client)

      // CLIENT newFileSync ]
      })
  }

  // check clients for file ]
}

MediaStorage.prototype.deleteMediaFile = function deleteMediaFile(path) {
  console.log('file deleted', path)
}

MediaStorage.prototype.checkFileFlag = function checkCanUpload(mediaInfo, flag) {
  var flags = this.filesflags[mediaInfo.fid]
  if (!flags)
    return false
  if (flags.indexOf(flag) != -1) {
    return true;
  }
  return false
}

MediaStorage.prototype.checkCanUpload = function checkCanUpload(mediaInfo) {
  if (this.checkFileFlag("downloadonly")) {
    return false;
  }
  return true;
}

MediaStorage.prototype.scanFile = function scanFile(type, path) {
  var self = this

  var mediaInfo = mediaFileInfo.extractMediaInfoFromPathEx(path)
  if (!mediaInfo)
      return false

  if (mediaInfo.type == 'image') {
    if (!(mediaInfo.ext == 'jpg' || mediaInfo.ext == 'jpeg' || mediaInfo.ext == 'png')) {
      console.log(`scanFile: bad ext ${mediaInfo.ext} ${path}`)
      return false
    }
  }

  if (isNaN(mediaInfo.nid)) {
    this.allocateFID(mediaInfo)
    var name = mediaFileInfo.FIDFromMediaInfo(mediaInfo)
    var newPath = this.getPathForName(name)
    fs.renameSync(path, newPath)
    path = newPath
//    return true;
  }

  if (type == 'scan' || type == 'change') {
    self.updateMediaFile(path)
  }
  if (type == 'delete') {
    self.deleteMediaFile(path)
  }

  return true
}

MediaStorage.prototype.clientConnected = function clientConnected(ws) {
  this.clients[ws] = {
    id: Math.random().toString(36).slice(2, 2 + 16),
    ws: ws,
    files: {},
    newFiles: {},
    mapFID: {},
    ondemand: false // send files on demand
  }
}

// CLIENT clientCheckNewFiles -> startSending() [

MediaStorage.prototype.clientCheckNewFiles = function clientCheckNewFiles(client) {
  if (_.size(client.newFiles) > 0) {
    // start send
    this.startSending()
    console.log('startSending!', _.size(client.newFiles));
  }
}

// CLIENT clientCheckNewFiles -> startSending() ]
// sending step [

MediaStorage.prototype.sendingStep = function sendingStep(self) {
  var self = this
  // start [

  var sf = self.sendingFile

  if (!sf) {
    function findPendingClientFile() {
      var found
      _.find(self.clients, function (client) {
        return _.find(client.newFiles, function (k, name) {
          if (k) {
            var f = self.mediaFiles[name]
            var mediaInfo = f
            if (!self.checkCanUpload(mediaInfo)) {
              return false
            }

            found = {
              client: client,
              name: name,
              path: f.path,
              offset: 0,
              size: 0,
              fd: -1
            }
            
            // STATS SENDING [

            self.stats.acpuDeviceId = client.ws.acpuDeviceId
            console.log(`stats.acpuDeviceId=${self.stats.acpuDeviceId}`)
            self.stats.acpuDeviceIdShort = self.stats.acpuDeviceId.split('-')[0]
            self.stats.newFilesCount = Object.keys(client.newFiles).length
            self.stats.mediaFilesCount = Object.keys(self.mediaFiles).length

            // STATS SENDING ]

            return true
          }
        })
      })
      return found
    }

    sf = self.sendingFile = findPendingClientFile()
    if (!sf) {
      self.stopSending()
      return
    }
    sf.fd = fs.openSync(sf.path, 'r')
    if (!sf.fd) {
      console.log('cannot open file', path)
      self.stopSending()
      return
    }
    // warning osx9 -> ubuntu sshfs rename chown mc fail -> stats.size == 0. need delay bugfix [
    var stats
    for (var i = 0; i < 20; i++) {
      stats = fs.statSync(sf.path)
      if (stats.size > 0)
        break;
      console.log('retry stats')
      var stop = new Date().getTime()
      var time = 1000
      while(new Date().getTime() < stop + time) {
      }
    }
    if (stats.size == 0) {
      console.log('Bad file size! stats.size==0');
    }
    // warning osx9 -> ubuntu sshfs rename chown mc fail -> stats.size == 0. need delay bugfix ]
    sf.size = stats.size

    self.sendingChunkStart()
  }

  // start ]
  // step [

  if (this.chunkId > 0 && self.chunkId % self.chunkApprove == 0) {
    if (self.lastChunkApproved < self.chunkId) {
      // waiting for approve
      return
    }
    else if (self.lastChunkApproved > self.chunkId) {
      // error
      console.error(`this.lastChunkApproved > this.chunkId ${self.lastChunkApproved} > ${self.chunkId}`)
//      self.stopSending()
//      return
    }
  }

  self.chunkId++

  var dataSize = 100000;
//  var buffer = new Buffer(dataSize)
  var buffer = new Buffer.alloc(dataSize)
  dataSize = fs.readSync(sf.fd, buffer, 0, dataSize, sf.offset)

  if (dataSize < buffer.length) {
//    var buffer1 = new Buffer(dataSize)
    var buffer1 = Buffer.alloc(dataSize)
    buffer.copy(buffer1, 0, 0, dataSize)
    buffer = buffer1
  }

  var m = {
    cmd: 'stream',
    signal: 'streamWrite',
    chunkId: self.chunkId,
    dataSize: dataSize,
    offset: sf.offset,
    size: sf.size,
    name: sf.name,
    date: (new Date()).getUTCMilliseconds(),
    data: buffer.toString('base64')
  }
//  console.log(res)
//  console.log('cmd=', m.cmd)
//  console.log('size=', m.size)
//  console.log('offset=', m.offset)
//  console.log('name=', m.name)
//  console.log('dataSize=', m.dataSize)

  if ((m.offset != 0 && m.offset % 5000000 == 0) || (m.offset+m.dataSize) == m.size) {
    console.log(`UP ${this.stats.acpuDeviceIdShort} ${this.stats.newFilesCount}/${this.stats.mediaFilesCount} chunk=${self.chunkId} ${m.offset}:${m.dataSize}/${m.size} ${m.name}`)
  }

  sf.offset += dataSize
//  this.sendingFile.client.ws

  this.sendMessage(sf.client.ws, m)


    // step ]
  // end [

  if (sf.offset >= sf.size) {

    // CLIENT sendFileDone -> delete newFile [

    delete sf.client.newFiles[sf.name]

    // CLIENT sendFileDone -> delete newFile ]

    self.sendingFile = null
  }

  // end ]
}

// sending step ]
// sending chunk start [

MediaStorage.prototype.sendingChunkStart = function sendingChunkStart() {
    // chunk
    this.chunkId = 0
    this.chunkApprove = 10
    this.lastChunkApproved = -1
}

// sending chunk start ]
// sending chunk approve [

MediaStorage.prototype.sendingChunkApprove = function sendingChunkApprove(m) {
  this.lastChunkApproved = m["chunkId"]
}

// sending chunk approve ]
// sending start [

MediaStorage.prototype.startSending = function startSending() {
  var self = this;
  if (!this.sending) {
    this.sending = true
    
    this.sendingInterval = setInterval(function () {
      self.sendingStep()
    }, 10, this)
  }
}

// sending start ]
// sending stop [

MediaStorage.prototype.stopSending = function stopSending() {
  if (this.sending) {
    this.sending = false
    clearInterval(this.sendingInterval)
  }
}

// sending stop ]
// send message [

MediaStorage.prototype.sendMessage = function sendMessage(ws, m) {
  var lpfx = llprefix+"/client-"+ws.acpuDeviceId+"/sendMessage"
  if (m.cmd == 'stream' && m.signal == 'streamWrite') {
    llog.log(lpfx, "streamWrite "+ m.offset+":"+m.dataSize+" ("+ m.size+")")
  }
  else if (m.cmd == 'stream' && m.signal == 'sendNext') {
    // nope
  }
  else {
    llog.log(lpfx, m)
  }
  var res = JSON.stringify(m)
  if (ws.readyState != ws.OPEN) {
    console.log('cannot send file ws.readyState != WebSocket.OPEN (', ws.readyState, '!=', ws.OPEN, ')')
    this.stopSending()
    return
  }

  ws.send(res)
}

// send message ]
// check unallocated [
// unallocated file: nid = -1.-2...

// OLD - todo: remove [

MediaStorage.prototype.checkUnallocated = function checkUnallocated(client, fid) {
  var info = mediaFileInfo.extractMediaInfoFromFID(fid)
  try {
    if (info && info.nid < 0 && !client.mapFID[fid]) {
      // unlocated
      info = this.allocateFID(info)
      var newFid = mediaFileInfo.FIDFromMediaInfo(info)
      client.mapFID[newFid] = fid
      client.mapFID[fid] = newFid
    }
  }
  catch (e) {
    console.error(e)
  }
}

// OLD - todo: remove ]

MediaStorage.prototype.checkUnallocated2 = function checkUnallocated2(node, fid) {
  var info = mediaFileInfo.extractMediaInfoFromFID(fid)
  
  if (info && info.nid < 0 && !node.isMapped(fid)) {
    // unlocated
    info = this.allocateFID(info)
    var newFid = mediaFileInfo.FIDFromMediaInfo(info)

    node.mapFile(newFid, fid)
  }
}

// check unallocated ]
// check file diff [


MediaStorage.prototype.checkFileDiff = function checkFileDiff(file) {
  let mediaInfo = this.mediaFiles[file.fid]
  if (mediaInfo) {
//    var name = mediaFileInfo.FIDFromMediaInfo(mediaInfo)
//    var path = this.getPathForName(mediaInfo.path)

      var stats = fs.statSync(mediaInfo.path)
//      stats.size

    if (!stats) {
      console.error('bad stats')
      return false
    }

    if (stats.size != file.size) {
      // todo: check hash also
      // todo: who is origin creator server/node
      
      console.warn(`file diff ${file.fid} server=${stats.size} != node=${file.size} size`)

      return true
    }
  }
  return false
}

// check file diff ]
// NEW createACPUNode [

MediaStorage.prototype.createACPUNode = function createACPUNode(ws) {
  var node = this.nodes[ws]
  if (node) {
//    console.error('Cannot allocate net node. Node already exists')
    return node 
  }

  console.log('Creating ACPUNode for acpuDeviceId', ws.acpuDeviceId)
  
  var client = this.clients[ws]
  if (!client) {
    console.error('Cannot find client for acpuDeviceId', ws.acpuDeviceId)
    return node 
  }

  node = new ACPUNode(this, client)

  this.nodes[ws] = node

  return node
}

// NEW createACPUNode ]
// NEW dellocateACPUNode [

// TODO: Deleting ACPUNode
MediaStorage.prototype.dellocateACPUNode = function deleteACPUNode(ws) {
  console.log('TODO: Deleting ACPUNode for', ws.client && ws.client.ws && ws.client.ws.acpuDeviceId)


}

// NEW dellocateACPUNode ]
// NEW checkMediaFile [

MediaStorage.prototype.checkMediaFile = function checkMediaFile(fid) {
  let iid = mediaFileInfo.IIDFromFID(fid)
  return !!this.mediaFilesIID[iid]
}
 
// NEW checkMediaFile ]
// bootstrap [

MediaStorage.prototype.bootstrap = function bootstrap(wss, ws, m) {
//  var client = this.clients[ws]
  var self = this

  var node = this.createACPUNode(ws)

  // Set ondemand
  node.client.ondemand = m.ondemand

  // check files [

  var newFiles = []

  _.each(m.files, function (file) {
    let fid = file.fid

    self.checkUnallocated2(node, fid)

    // Check previous sync errors
    var isDiff = !self.checkFileDiff(file)
    
    if (!self.checkMediaFile(fid)) {
      newFiles.push(fid)
    }

    node.setFile(file)
  })

  node.syncMediaFiles()

  // check files ]
  // dump [

  var lpfx = llprefix+"/client-"+ws.acpuDeviceId+"/"
  llog.log(lpfx+"newFiles", newFiles)
  llog.log(lpfx+"this.mediaFilesMaxNID", this.mediaFilesMaxNID)
  node.dumpStats(llog, lpfx)

  // dump ]
  // send bootstrapFiles [

  var res = {
    cmd: 'stream',
    signal: 'bootstrapFiles',
    files: newFiles
  }
  this.sendMessage(ws, res)

  // send bootstrapFiles ]

  node.startSendingNewFiles()
}

// bootstrap ]
// requestFile [

MediaStorage.prototype.requestFile = function requestFile(wss, ws, iid) {
  var self = this

  if (iid == 'font/1000/0/0') 
    return; // FORCE SKIP

  var node = this.createACPUNode(ws)

  var mediaInfo = this.mediaFilesIID[iid]
  if (!mediaInfo) {
    console.error("requestFile not found ", iid)
    return
  }

  this.addNewFile2(node.client, mediaInfo.fid)

  node.startSendingNewFiles()
}

// requestFile ]
// write [

MediaStorage.prototype.write = function write(wss, ws, m) {
//  console.log('cmd=', m.cmd)
//  console.log('size=', m.size)
//  console.log('offset=', m.offset)
//  console.log('name=', m.name)
//  console.log('dataSize=', m.dataSize)

  var self = this
  var client = this.clients[ws]

  var lpfx = llprefix+"/client-"+ws.acpuDeviceId+"/"

  var fid = m.name
  if (!this.checkPermissions(fid, 'down')) {
    console.log("sendSkip", fid)
    var res = {
      cmd: 'stream',
      signal: 'sendSkip',
      name: fid
    }
    this.sendMessage(ws, res)
    return;
  }

  // notify next send [

  var res = {
    cmd: 'stream',
    signal: 'sendNext'
  }
  this.sendMessage(ws, res)

  // notify next send ]

  var offset = m.offset
  var dataSize = m.dataSize
  var size = m.size

  // open [

  var did = ws.acpuDeviceId + m.name

  if (!this.downloads[did]) {
    var info = mediaFileInfo.extractMediaInfoFromFID(m.name)
    if (!info) {
      console.log('can not open file, bad file name:', m.name)
      return
    }
    var pid = mediaFileInfo.PIDFromMediaInfo(info)
    this.updateMaxNID(pid)
    this.checkUnallocated(client, m.name)

    llog.log(lpfx+"download", "open "+m.name)
    llog.log(lpfx+"download", "mediaFilesMaxNID")
    llog.log(lpfx+"download", this.mediaFilesMaxNID)

    this.downloads[did] = {
      tmpfile: temp.openSync(m.name.replace(/\//g, '_')),
      downloadSize: 0,
      prevoffset: 0,
      percentDelta: 0
    }
  }

  // open ]
  // write [

  var f = this.downloads[did]
  if (offset < f.prevoffset) {
    console.log('WARNING! offset < prevoffset', offset, f.prevoffset)
  }
  f.prevoffset = offset
  f.downloadSize += dataSize
  f.percentDelta += (dataSize / m.size) * 100.

//  var buf = new Buffer(m.data, 'base64')
  var buf = Buffer.from(m.data, 'base64');
  if (f.percentDelta >= 10 || f.downloadSize == m.size) {
    f.percentDelta = 0
    var percent = (f.downloadSize / m.size)* 100.
    console.log(f.tmpfile.path, f.tmpfile.fd, Math.round(percent)+'%', offset, m.size, buf.length)
  }
  fs.writeSync(f.tmpfile.fd, buf, 0, buf.length, offset)

  // write ]
  // close [

  if (f.downloadSize >= size) {
    fs.closeSync(f.tmpfile.fd)

    var renamed
    var name = m.name

    var oldName = name
    if (client.mapFID[name]) {
      
      // TODO: dellocateACPUNode(ws)
      var node = this.nodes[ws]
      if (node) {
        this.dellocateACPUNode(node)
      }

      var name = client.mapFID[name]
      client.files[name] = {}
      delete client.mapFID[oldName]
      delete client.mapFID[name]
      renamed = true
      llog.log(lpfx+"client.mapFID", client.mapFID)
    }

    var self = this;

    var path = this.getPathForName(name)

    mkdirp(ppath.dirname(path), function (err) {
      if (err)
        return console.error(err)
      
      try {
//      fs.renameSync(f.tmpfile.path, path) // not working for different disks
      var execSync = require('child_process').execSync
      var history = execSync("mv '"+f.tmpfile.path.replace("'", "\'")+"' '"+path.replace("'", "\'")+"'", { encoding: 'utf8' })
      process.stdout.write(history)

      if (renamed) {
        // notify move [

        var res = {
          cmd: 'stream',
          signal: 'moveFile',
          name: oldName,
          newName: name
        }
        self.sendMessage(ws, res)

        // notify move ]

        self.updateMediaFile(path)
      }
      }
      catch (e) {
        console.log("error mv ", e);
        console.log("Can't move file ", path);
      }
    })

    delete this.downloads[did]
  }

  // close ]
}

// write ]
// lock/unlock file [

MediaStorage.prototype.lockFile = function lockFile(fid) {
}
MediaStorage.prototype.unlockFile = function unlockFile(fid) {
}

// lock/unlock file ]
// getPathForName [

MediaStorage.prototype.getPathForName = function getPathForName(name) {
  // todo: extractMediaInfoFromName -> path
  return this.commonpath + '/' + name
}

// getPathForName ]

MediaStorage.prototype.setLiveLogging = function setLiveLogging(LiveLogging) {
  llog = LiveLogging
  llprefix = "acpu-server/MediaStorage"
  llog.erase(llprefix)
  llog.log(llprefix, "Ready")
}


module.exports = MediaStorage
