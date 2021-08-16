import {GPlayerEvent, GErrorType, GPlaybackControlStatus} from "./gplayer-events.js"
import {GPlayer} from "./gplayer.js"

import Hls from "hls.js";

import {GHelperEvent} from "../helper/ghelper-events.js";
import { GHelper } from "../helper/ghelper.js";

export class HlsPlayer extends GPlayer {

    constructor () {
        super('hls-player');
        this.TAG = 'HlsPlayer';
        
        this.checkCnt = 0;
        this.url = "";
        this.player = null;
        this.element = null;

        this.helpUrl = null;
        this.helper = null;

        this.callbackTimeUpdate = null;
        this.callbackStatistics = null;
        this.callbackError = null;
        this.callbackMediaSourceEnd = null;
        this.callbackMediaState = null;
        this.callbackPlaybackControlEvent = null;

        this.e = {
            onTimeUpdate : this._onElementTime.bind(this)
        };
    }

    static isSupported() {
        let tmpVideo = document.createElement("video");
        return tmpVideo.canPlayType('application/vnd.apple.mpegurl') || 
            (Hls!=null && Hls.isSupported());
    }

    init (url, config) {
        this.url = url;
        this._checkConfig(config);
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
        else if (event === GPlayerEvent.MEDIA_STATE) {
            this.callbackMediaState = call;
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
        else if (event === GPlayerEvent.MEDIA_STATE) {
            this.callbackMediaState = null;
        }
        else if (event === GPlayerEvent.PLAYBACK_CONTROL_EVENT) {
            this.callbackPlaybackControlEvent = null;
        }
    }

    attachMediaElement(el) {
        this.element = el;
        this.element.addEventListener("timeupdate", this.e.onTimeUpdate);
    }

    load() {
        if (this.helpUrl != null) {
            let sessionid = this._parseUrlForSessionid(this.url);
            this.helper = new GHelper();
            this.helper.init(this.helpUrl, sessionid);
            this.helper.on(GHelperEvent.MEDIA_STATE,this._onMediaState.bind(this));
            this.helper.on(GHelperEvent.HLS_USAGE, this._onHlsUsage.bind(this));
        }

        //开始播放
        this._httpGet(this.url, this._receiveCheckPlayurlData.bind(this));
    }

    play() {
        this.element.src = this.url;
    }

    capture() {
        let canvas = document.createElement("canvas");
        canvas.width = this.element.videoWidth;
        canvas.height = this.element.videoHeight;
        canvas.getContext('2d').drawImage(this.element, 0, 0, canvas.width, canvas.height);
        let dataurl = canvas.toDataURL();
        return dataurl;
    }

    pause() {
        this.element.pause();
        return false;
    }

    resume() {
        this.element.play();
        return false;
    }

    seekToNewestTime () {
        let buffered = this.element.buffered;
        if (buffered.length > 0) { 
            let from = buffered.start(buffered.length -1);
            let to = buffered.end(buffered.length -1);
            this.element.currentTime = to;
        }
    }

    seek(time) {
        return true;
    }

    setPlaySpeed(speed) {
        if (this.element == null) {
            return;
        }
        this.element.playbackRate = speed;
    }

    destroy() {
        if (this.helper != null) {
            this.helper.destroy();
        }

        if (this.element != null) {
            this.element.removeEventListener("timeupdate", this.e.onTimeUpdate);
        }

        if (this.element.canPlayType('application/vnd.apple.mpegurl')) 
        {//苹果safari浏览器
            this.element.stop();
        } 
        else if (Hls.isSupported()) 
        {//非苹果safari浏览器，且支持hls.js
            if (this.player) 
            {
                this.player.destroy();
                this.player = null;
            }
        }

        this.element = null;
    }

    _checkConfig(config) {
        if (config == null) {
            return;
        }

        if (config.helpUrl != null) {
            this.helpUrl = config.helpUrl;
        }
    }

    _parseUrlForSessionid(hlsUrl) {
        let arrUri = hlsUrl.split('?');
        if (arrUri.length < 2) {
            return "";
        }

        let arrParam = arrUri[1].split('&');
        for (let i = 0; i < arrParam.length; ++i) {
            let arrKV = arrParam[i].split('=');
            if (arrKV.length < 2) {
                continue;
            };
            if (arrKV[0] == "sessionid") {
                return arrKV[1];
            }
        }
        return "";
    }

    _onMediaState(info) {
        if (this.callbackMediaState != null) {
            this.callbackMediaState(info);
        }
    }

    _onHlsUsage(data) {
        if (this.callbackStatistics != null) {
            let info = {};
            info.speed = data.speed;
            this.callbackStatistics(info);
        }
    }

    _onStatisticsInfo(data) {
        if (this.callbackStatistics != null) {
            let info = {};
            info.speed = data.speed;
            this.callbackStatistics(info);
        }
    }

    _onElementTime(event) {
        if (this.callbackTimeUpdate != null && this.element != null) {
            this.callbackTimeUpdate(this.element.currentTime);
        }
    }

    _receiveCheckPlayurlData(url, bOk, data)
    {
        //这部分定时任务的目的：
        //因为调用实时视频接口后，平台才开始下发播放命令给设备，然后设备才会推视频流到平台,然后流媒体平台才会生成m3u8文件。
        //在m3u8文件生成前，使用播放地址播放会返回无法访问。
        if(!bOk)
        {
            //因为可能出现播放的设备不在线或网络差等原因设备不会推流数据上来
            //因此建议每隔500毫秒尝试一次，一共尝试34次，即17秒超时
            this.checkCnt++;
            if(this.checkCnt > 34)
            {
                console.log("超时未检测到播放地址可以播放");
                this.checkCnt = 0;
                return;
            }
            setTimeout(()=>{
                this._httpGet(url, this._receiveCheckPlayurlData.bind(this))
            }, 500);
            return;
        }

        //检测到m3u8文件已经生成，播放地址已经可以播放
        this.checkCnt = 0;
        this.element.setAttribute('crossOrigin', 'anonymous');
        if (this.element.canPlayType('application/vnd.apple.mpegurl')) 
        {//苹果safari浏览器，可以不用hls.js直接将hls地址赋值给video标签的src即可
            this.element.src = url;
        } 
        else if (Hls.isSupported()) 
        {//非苹果safari浏览器，且支持hls.js
            this.player = new Hls();
            this.player.loadSource(url);
            this.player.attachMedia(this.element);
        }
    }

    //封装http get请求
    _httpGet(url, func)
    {
        let request = new XMLHttpRequest();
        request.open("GET", url);
        request.timeout = 2000;
        request.onload = (event)=>{
            if(request.status!=200){
                console.log('http get not 200');
                func(url, false, null);
            }
            else {
                let data = request.response;
                console.log(data);
                func(url, true, data);
            }
        }
        request.ontimeout = (event)=>{
            console.log('http get time out');
            func(url, false, null);
        }
        request.onerror = (event)=>{
            console.log('http get error');
            func(url, false, null);
        }
        request.send();
    }
}

