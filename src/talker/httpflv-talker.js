import {GTalkerEvent, GTalkerConnectStatus, GTalkerConnectErrorType} from "./gtalker-events.js"
import {GTalker} from "./gtalker.js"
import {ByteArray} from "../common/bytearray.js"
import {Util} from "../common/util.js"

import flvjs from "flv-g7.js";

import Recorder from 'recorder-core'
import 'recorder-core/src/engine/mp3'
import 'recorder-core/src/engine/mp3-engine'

const AudioBufLen = 640;
const DebugFlag = false;

export class HttpFlvTalker extends GTalker {

    constructor () {
        super('httpflv-talker');
        this.TAG = 'HttpFlvTalker';

        this.downUrl = null;
        this.upUrl = null;
        this.imei = null;
        this.channel = null;
        
        this.player = null;
        this.recorder = null;
        this.sender = null;
        this.element = null;

        this.callbackConnectStatus = null;

        this.byteArray = new ByteArray();

        this.timerCheck = null;
        this.timerSend = null;

        this.hasReceiveServerData = false;
        this.hasSendClientData = false;
        this.hasWaitOpenMicrophoneTimeout = false;
        this.hasDestory = false;
    }

    static isSupported() {
        return typeof WebSocket != 'undefined' && Recorder.Support() && window.MediaSource &&
            window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
    }

    init(downUrl, upUrl, imei, channel, config) {
        this.downUrl = downUrl;
        this.upUrl = upUrl;
        this.imei = imei;
        this.channel = channel;
        if (!this._checkInputParam()) {
            return false;
        }

        this._startPlayer(downUrl);
        return true;
    }

    on(event, call) {
        if (event === GTalkerEvent.CONNECT_STATUS) {
            this.callbackConnectStatus = call;
        }
    }

    off(event) {
        if (event === GTalkerEvent.CONNECT_STATUS) {
            this.callbackConnectStatus = null;
        }
    }

    attachMediaElement(element) {  
        this.element = element;

        this.element.addEventListener("loadeddata", this._onPlayerLoadedData.bind(this), {once: true});
        this.player.on(flvjs.Events.ERROR, this._onPlayerError.bind(this));
        this.player.setMediaSourceEndCallback(this._onPlayerMediaSourceEnd.bind(this));

        this.player.attachMediaElement(element);
    }

    load() {
        this.player.load();
        this._startSender(this.upUrl);
    }

    destroy() {
        this.hasDestory = true;

        this._destroyPlayer();
        this._destroySender();
        this._destroyRecorder();
        this._destroySendProc();
    }

    _checkInputParam() {
        if (Util.isEmptyString(this.downUrl) || Util.isEmptyString(this.upUrl)) {
            return false;
        }
        if (Util.isEmptyString(this.imei)) {
            return false;
        }
        if (this.channel < 0 || this.channel > 255) {
            return false;
        }
        return true;
    }

    _startPlayer(url) {
        this._destroyPlayer();

        this.player = flvjs.createPlayer({isLive:true, type:'flv',url:url}, {
            lazyLoad: false,
            enableStashBuffer: false,
            deferLoadAfterSourceOpen:true
        });
    }

    _onPlayerLoadedData() {
        if (DebugFlag) {
            console.log("player loadedData");
        }

        this.hasReceiveServerData = true;
        if (this.hasSendClientData && this.callbackConnectStatus != null) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectSuccess, "");
        }
    }

    _onPlayerError(type, detail, errObj) {
        if (DebugFlag) {
            console.log("player error");
        }

        if (this.callbackConnectStatus == null) {
            return;
        }

        if (this.hasReceiveServerData) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectError, 
                GTalkerConnectErrorType.DownLinkFail);
        }
        else {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectError, 
                GTalkerConnectErrorType.DeviceNotResponding);
        }
    }

    _onPlayerMediaSourceEnd(info) {
        if (DebugFlag) {
            console.log("player source end");
        }

        if (this.callbackConnectStatus != null) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectError, 
                GTalkerConnectErrorType.DeviceStopedResponding);
        }
    }

    _destroyPlayer() {
        if (this.player != null) {
            this.player.pause();
            this.player.unload();
            this.player.detachMediaElement();
            this.player.destroy();
            this.player = null;
        }

        if (this.element != null) {
            this.element = null;
        }
    }

    _startSender(url) {
        this.sender = new WebSocket(url);
        this.sender.onopen = this._onSenderOpen.bind(this);
        this.sender.onmessage = this._onSenderMsg.bind(this);
        this.sender.onclose = this._onSenderClose.bind(this);
        this.sender.onerror = this._onSenderError.bind(this);
    }

    _onSenderOpen() {
        if (DebugFlag) {
            console.log("websocket open");
        }
        
        this._startRecorder();
    }

    _onSenderMsg(e) {
        
    }

    _onSenderClose(e) {
        if (DebugFlag) {
            console.log("websocket close");
        }

        if (this.callbackConnectStatus != null) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectError, 
                GTalkerConnectErrorType.UpLinkFail);
        }
    }

    _onSenderError(e) {
        if (DebugFlag) {
            console.log("websocket error");
        }
    }

    _destroySender() {
        this.sender.close();
        this.sender = null;
    }

    _startRecorder() {
        if (this.recorder) {
            this.recorder.close();
        }

        this.recorder = Recorder({
            type:"mp3",
            sampleRate:8000,
            bitRate:16,
            onProcess:this._onReceiveMicrophoneData.bind(this)
        });
        this.timerCheck = setTimeout(this._timeoutCheckIfAllowOpenMicrophone.bind(this),10000);
        this.recorder.open(this._onAllowOpenMicrophone.bind(this),
            this._onNotAllowOpenMicrophone.bind(this));
    }

    _timeoutCheckIfAllowOpenMicrophone() {
        if (DebugFlag) {
            console.log("user WaitOpenMicrophone Timeout");
        }

        this.hasWaitOpenMicrophoneTimeout = true;

        if (this.callbackConnectStatus != null) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectError, 
                GTalkerConnectErrorType.WaitOpenMicrophoneTimeout);
        }
    }

    _onAllowOpenMicrophone() {
        if (DebugFlag) {
            console.log("user AllowOpenMicrophone");
        }

        if (this.hasWaitOpenMicrophoneTimeout) {
            return;
        }

        clearTimeout(this.timerCheck);

        this.hasSendClientData = true;
        if (this.hasReceiveServerData && this.callbackConnectStatus != null) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectSuccess, "");
        }

        this.recorder.start();
        this._sendProc();
    }

    _onNotAllowOpenMicrophone(msg, isUserNotAllow) {
        if (DebugFlag) {
            console.log("user NotAllowOpenMicrophone");
        }

        clearTimeout(this.timerCheck);

        if (this.callbackConnectStatus != null) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectError, 
                GTalkerConnectErrorType.NotAllowOpenMicrophone);
        }
    }

    _onReceiveMicrophoneData(buffers, powerLevel, bufferDuration, bufferSampleRate) {
        let arrayBuf = buffers[buffers.length - 1].buffer; //Uint16Array To ArrayBuffer
        let u8buf = new Uint8Array(arrayBuf); //ArrayBuffer To Uint8Array
        this.byteArray.push(u8buf);
    }

    _destroyRecorder() {
        this.recorder.close();
        this.recorder = null;
    }

    _sendProc() {
        if (this.hasDestory) {
            return;
        }

        if (this.byteArray.length < AudioBufLen) {
            this.timerSend = setTimeout(this._sendProc.bind(this), 5);
        }
        else {
            let audioBuf = this.byteArray.readBytes(AudioBufLen);

            let packer = new ByteArray();
            packer.push(new Uint8Array([0x31,0x32,0x63,0x64]));
            let arrImeiChar = this.imei.split('');
            for (let i = 0; i < arrImeiChar.length; i++) {
                packer.push(new Uint8Array([arrImeiChar[i].charCodeAt()]));
            }
            packer.push(new Uint8Array([parseInt(this.channel)]));
            packer.push(new Uint8Array([Math.floor(AudioBufLen/256)]));
            packer.push(new Uint8Array([AudioBufLen%256]));
            packer.push(audioBuf);

            let totalLen = 4 + arrImeiChar.length + 3 + AudioBufLen;
            if (this.sender != null) {
                this.sender.send(packer.readBytes(totalLen));
            }

            this._sendProc();
        }
    }

    _destroySendProc() {
        clearTimeout(this.timerSend);
    }
}