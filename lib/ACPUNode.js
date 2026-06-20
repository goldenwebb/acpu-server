// SPDX-License-Identifier: MIT
// Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

// ACPUNode = Client = NetNode = Node

var mkdirp = require('mkdirp'),
  _ = require('underscore'),
  temp = require('temp'),
  fs = require('fs'),
  ppath = require('path'),
  mediaFileInfo = require('./MediaFileInfo')

// TODO: MediaFile
class MediaFile {

}

class ACPUNode {
    // old client structure with ws
    client = null

    // MediaStorage
    media = null

    // Client media files
    mediaFiles = { 
        // iid=<type>/<pool>/<id>/<i>
        // iid : MediaFile
    }
    
    constructor(media, client) {
        this.media = media
        this.client = client

        client.mapFID = client.mapFID || {}

    }

    // TODO: replace fid to iid in mapping

    setFile(file) {
        this.client.files[file.fid] = file // old

        let iid = mediaFileInfo.IIDFromFID(file.fid)
        this.mediaFiles[iid] = file
    }

    checkMediaFile(fid) {
        let iid = mediaFileInfo.IIDFromFID(fid)
        let res = !this.mediaFiles[iid] && !this.client.newFiles[fid]
        return res
    }

    newFilePush(fid) {
        console.log("client.newFiles", fid)
        this.client.newFiles[fid] = {}
    } 

    // MAP FILE <oldFid>-<newFid> [

    isMapped(fid) {
        return !!this.client.mapFID[fid]
    }

    mapFile(newFid, fid) {
        this.client.mapFID[newFid] = fid
        this.client.mapFID[fid] = newFid
    }

    // MAP FILE <oldFid>-<newFid> ]

    //

    syncMediaFiles() {
        var self = this
        _.each(this.media.mediaFiles, function (f, fid) {
            self.addNewFile(fid)
        })
    }

    addNewFile(fid) {
        let iid = mediaFileInfo.IIDFromFID(fid)
//        if (!this.mediaFiles[iid] && !this.client.newFiles[fid]) {
        if (this.checkMediaFile(fid)) {
//            console.warn("addNewFile?", fid);
            if (this.media.checkPermissions(fid, 'up')) {
                if (this.media.checkPermissions(fid, 'ondemand')) {
                    if (this.client.ondemand)
                      return; 
                  }
            
                this.newFilePush(fid)
            }
        }
    }

    // 

    startSendingNewFiles() {
        if (_.size(this.client.newFiles) > 0) {
            // start send
            console.log('startSending!', _.size(this.client.newFiles));

            this.media.startSending()
        }
    }

    //

    dumpStats(llog, lpfx) {
        llog.log(lpfx+"client.mapFID", this.client.mapFID)
        llog.log(lpfx+"client.newFiles", this.client.newFiles)
        llog.log(lpfx+"client.files", this.client.files)
    }
}

module.exports = ACPUNode
