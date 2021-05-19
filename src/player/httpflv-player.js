import {GPlayerEvent, GErrorType, GPlaybackControlStatus} from "./gplayer-events.js"
import {GPlayer} from "./gplayer.js"
import flvjs from "flv-g7.js";

const PlaybackKey = "g7-flv-video-playback";

const PlaybackControl = {
    None:0,
    Active:1,
    Passive:2
}

export class HttpFlvPlayer extends GPlayer {

    constructor () {
        super('httpflv-player');
        this.TAG = 'HttpFlvPlayer';
        
        this.player = null;
        this.element = null;
        this.isLive = true;

        this.playbackPlan = 1;
        this.playbackControl = PlaybackControl.None;

        this.streamEnd = false;
        this.needSeek = false;
        this.seeking = false;
        this.seekTime = 0;
        this.newPlayStartTime = 0;
        this.lastSendSeekTs = 0;

        this.callbackTimeUpdate = null;
        this.callbackStatistics = null;
        this.callbackError = null;
        this.callbackMediaSourceEnd = null;
        this.callbackPlaybackControlEvent = null;

        this.checkerSeek = null;

        this.e = {
            onTimeUpdate : this._onElementTime.bind(this)
        };
    }

    init (url, config) {
        this._checkConfig(config);
        this.isLive = this._checkIfLive(url);  
        this.playbackControl = this._checkPlaybackControl(url);  

        this.player = flvjs.createPlayer({isLive:this.isLive, type:'flv',url:url}, {
            lazyLoad: false,
            enableStashBuffer: false,
            deferLoadAfterSourceOpen:true
        });

        this.player.on(flvjs.Events.STATISTICS_INFO, this._onStatisticsInfo.bind(this));
        this.player.on(flvjs.Events.ERROR, this._onError.bind(this));
        this.player.setMediaSourceEndCallback(this._onMediaSourceEnd.bind(this));
        this.player.setStreamTimeCallback(this._onStreamTime.bind(this));
    }

    on(event, call) {
        if (event === GPlayerEvent.TIMEUPDATE) {
            this.callbackTimeUpdate = call;
        }
        else if (event === GPlayerEvent.STATISTICS_INFO) {
            this.callbackStatistics = call;
        }
        else if (event === GPlayerEvent.ERROR) {
            this.callbackError = call;
        }
        else if (event === GPlayerEvent.MEDIA_SOURCE_END) {
            this.callbackMediaSourceEnd = call;
        }
        else if (event === GPlayerEvent.PLAYBACK_CONTROL_EVENT) {
            this.callbackPlaybackControlEvent = call;
        }
    }

    off(event) {
        if (event === GPlayerEvent.TIMEUPDATE) {
            this.callbackTimeUpdate = null;
        }
        else if (event === GPlayerEvent.STATISTICS_INFO) {
            this.callbackStatistics = null;
        }
        else if (event === GPlayerEvent.ERROR) {
            this.callbackError = null;
        }
        else if (event === GPlayerEvent.MEDIA_SOURCE_END) {
            this.callbackMediaSourceEnd = null;
        }
        else if (event === GPlayerEvent.PLAYBACK_CONTROL_EVENT) {
            this.callbackPlaybackControlEvent = null;
        }
    }

    attachMediaElement(el) {
        this.element = el;
        this.element.addEventListener("timeupdate", this.e.onTimeUpdate);
        this.player.attachMediaElement(el);
    }

    load() {
        this.player.load();
    }

    play() {
        this.player.play();
    }

    pause() {
        this.element.pause();
        return false;
    }

    resume() {
        this.element.play();
        return false;
    }

    capture() {
        let canvas = document.createElement("canvas");
        canvas.width = this.element.videoWidth;
        canvas.height = this.element.videoHeight;
        canvas.getContext('2d').drawImage(this.element, 0, 0, canvas.width, canvas.height);
        let dataurl = canvas.toDataURL();
        return dataurl;
    }

    seek(time) {
        if (this.element == null) {
            return false;
        }
        if (this.seeking) {
            return false;
        }
        
        if (this.callbackPlaybackControlEvent != null) {
            this.callbackPlaybackControlEvent(GPlaybackControlStatus.SeekStart, 
                "开始切换播放时间");
        }

        if (!this._seekByCached(time)) {
            return false;
        }
        if (this.playbackControl == PlaybackControl.Active) {
            this._seekByActive(time);
        }
        else {
            this._seekByPassive(time);
        }
        return true;
    }

    destroy() {
        if (this.player != null) {
            this.player.pause();
            this.player.unload();
            this.player.detachMediaElement();
            this.player.destroy();
            this.player = null;
        }

        if (this.element != null) {
            this.element.removeEventListener("timeupdate", this.e.onTimeUpdate);
            this.element = null;
        }
    }

    _checkConfig(config) {
        if (config == null) {
            return;
        }

        if (config.playbackPlan != null) {
            this.playbackPlan = config.playbackPlan;
        }
    }

    _checkIfLive(url) {
        if (url.indexOf(PlaybackKey) != -1) {
            return false;
        }
        return true;
    }

    _checkPlaybackControl(url) {
        let arr = url.split('&stream=');
        if (arr.length < 2 || arr[1].length < 3) {
            return PlaybackControl.None;
        }
        let streamName = arr[1];
        let deviceType = streamName.substring(0,3);
        if (deviceType == '131') {
            return PlaybackControl.Passive;
        }
        return PlaybackControl.Active;
    }

    _seekByCached(time) {
        if (!this.streamEnd) {
            return true;
        }

        this.seeking = true;

        let bCached = false;
        let buffered = this.element.buffered;
        for (let i = 0; i < buffered.length; i++) {
            let from = buffered.start(i);
            let to = buffered.end(i);
            if (time > from && time < to) {
                bCached = true;
            }
        }

        if (bCached && time > this.element.currentTime) {
            this.element.currentTime = time;
            if (this.callbackPlaybackControlEvent != null) {
                this.callbackPlaybackControlEvent(GPlaybackControlStatus.SeekSuccess,
                    "切换播放时间成功");
            }
        }
        else {
            if (this.callbackPlaybackControlEvent != null) {
                this.callbackPlaybackControlEvent(GPlaybackControlStatus.SeekFail,
                    "缓冲流已结束，无法切换到未缓冲区域");
            }
        }

        this.seeking = false;
        return false;
    }

    _seekByActive(time) {
        this.seeking = true;

        this.lastSendSeekTs = new Date().getTime();

        this.checkerSeek = setTimeout(()=>{
            this.needSeek = false;
            this.seeking = false;
            if (this.callbackPlaybackControlEvent != null) {
                this.callbackPlaybackControlEvent(GPlaybackControlStatus.SeekFail,
                    "切换播放时间失败，请重新尝试");
            }
        },15*1000);

        this.seekTime = time;
        this.needSeek = true;
    }

    _seekByPassive(time) {
        this.seeking = true;

        this.seekTime = time;
        //获取当前video标签解码缓存
        let buffered = this.element.buffered;
        if (buffered.length > 0) { 
            //由设备端控制回放的buffered只会产生一段
            let from = buffered.start(0);
            let to = buffered.end(0);
            this.newPlayStartTime = to;

            this.element.currentTime = this.newPlayStartTime;
        }

        setTimeout(()=>{
            this.seeking = false;
            if (this.callbackPlaybackControlEvent != null) {
                this.callbackPlaybackControlEvent(GPlaybackControlStatus.SeekSuccess,
                    "切换播放时间成功");
            }
        },1000);
    }

    _onStatisticsInfo(data) {
        if (this.callbackStatistics != null) {
            let info = {};
            info.speed = data.speed;
            this.callbackStatistics(info);
        }
    }

    _onError(type, detail, errObj) {
        if (this.callbackError != null) {
            let gtype = type;
            let gsubtype = detail;
            let info = type;
            this.callbackError(type, gsubtype, info);
        }
    }

    _onMediaSourceEnd(info) {
        this.streamEnd = true;
        if (this.callbackMediaSourceEnd != null) {
            this.callbackMediaSourceEnd();
        }
    }

    _onElementTime(event) {
        //回放方案1
        if (this.playbackPlan == 1) {
            if (this.callbackTimeUpdate != null && this.element != null) {
                this.callbackTimeUpdate(this.element.currentTime);
            }
            return;
        }

        //回放方案2
        if (this.playbackControl === PlaybackControl.Active) {
            if (!this.seeking && this.callbackTimeUpdate != null && this.element != null) {
                this.callbackTimeUpdate(this.element.currentTime);
            }
        }
        else if (this.playbackControl === PlaybackControl.Passive) {
            if (!this.seeking && this.callbackTimeUpdate != null && this.element != null) {
                let curPlayTime = this.seekTime + (this.element.currentTime - this.newPlayStartTime);
                this.callbackTimeUpdate(curPlayTime);
            }
        }
    }

    _onStreamTime(time) {
        if (this.needSeek) {
            if (Math.abs(this.seekTime*1000 - time) >= 1000) {
                return;
            }

            if (this.checkerSeek != null) {
                clearTimeout(this.checkerSeek);
                this.checkerSeek = null;
            }

            this.needSeek = false;
            setTimeout(()=>{
                this.seeking = false;
                this.element.currentTime = time/1000;
                let off = new Date().getTime() - this.lastSendSeekTs;
                console.log("切换耗时: " + off);
                if (this.callbackPlaybackControlEvent != null) {
                    this.callbackPlaybackControlEvent(GPlaybackControlStatus.SeekSuccess,
                        "切换播放时间成功");
                }
            },1000);
            return;
        }
    }
}

