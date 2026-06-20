// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

class MediaFileInfo {
    
}

// 

function extractMediaInfoFromPathEx(path, testNid) {
    var s = path.split('/')
    if (s.length < 4)
      return false
    var name = s.pop()
    var fid = s.pop()
    var pool = s.pop()
    var type = s.pop()
    var media = s.pop()
    if (media !== 'media')
      return false
    var n = parseInt(pool, 10)
    if (isNaN(n))
      return false
    n = parseInt(fid, 10)
    if (isNaN(n))
      return false
    var ss = name.split('.')
    var ext = ss.pop() //name.split('.').pop()
    var ss1 = ss.join()
    var ss2 = ss1.split('_')
    var suffix
    var n0 = ss2[0]
    //var n0 = name.split('_')[0]
    n = parseInt(n0, 10)
    if (isNaN(n)) {
      if (testNid) {
          return false
      }
    }
    else {
      ss2.shift()
    }
    suffix = ss2.join('_')
  
    return {type: type, pool: pool, fid: fid, name: name, nid: n, ext: ext, suffix: suffix}
  }
  
  function extractMediaInfoFromPath(path) {
    return extractMediaInfoFromPathEx(path, true)
  }
  
  function extractMediaInfoFromFID(fid) {
    return extractMediaInfoFromPath('media/' + fid)
  }
  
  function checkMediaFile(path) {
    return !!extractMediaInfoFromPath(path)
  }

// MediaInfo to string [
  
  // mediaInfo -> <type>/<pool>/<id>/<name>
  function FIDFromMediaInfo(mediaInfo) {
    return mediaInfo && mediaInfo.type+'/'+mediaInfo.pool+'/'+mediaInfo.fid+'/'+mediaInfo.name
  }
  
  // mediaInfo -> <type>/<pool>/<id>
  function PIDFromMediaInfo(mediaInfo) {
    return mediaInfo && mediaInfo.type+'/'+mediaInfo.pool+'/'+mediaInfo.fid
  }

// mediaInfo -> <type>/<pool>/<id>/<i>
function IIDFromMediaInfo(mediaInfo) {
    return mediaInfo && mediaInfo.type+`/${mediaInfo.pool}/${mediaInfo.fid}/${mediaInfo.nid}`
}
    
// MediaInfo to string ]

  // fid -> <type>/<pool>/<id>
  function PIDFromFID(fid) {
    var mediaInfo = extractMediaInfoFromFID(fid)
    return PIDFromMediaInfo(mediaInfo)
  }
 
  // fid -> <type>/<pool>/<id>/<i>
  function IIDFromFID(fid) {
    var mediaInfo = extractMediaInfoFromFID(fid)
    return IIDFromMediaInfo(mediaInfo)
  }
 
  function extractFIDFromPath(path) {
    var mediaInfo = extractMediaInfoFromPath(path)
    return FIDFromMediaInfo(mediaInfo)
  }
  
  function extractPIDFromPath(path) {
    var mediaInfo = extractMediaInfoFromPath(path)
    return PIDFromMediaInfo(mediaInfo)
  }
  
  
module.exports = {
    MediaFileInfo: MediaFileInfo,

    extractMediaInfoFromPathEx: extractMediaInfoFromPathEx,
    extractMediaInfoFromPath: extractMediaInfoFromPath,
    extractMediaInfoFromFID: extractMediaInfoFromFID,
    checkMediaFile: checkMediaFile,
    FIDFromMediaInfo: FIDFromMediaInfo,
    PIDFromMediaInfo: PIDFromMediaInfo,
    IIDFromMediaInfo: IIDFromMediaInfo,
    PIDFromFID: PIDFromFID,
    IIDFromFID: IIDFromFID,
    extractFIDFromPath: extractFIDFromPath,
    extractPIDFromPath: extractPIDFromPath
}
