import {GTalkerEvent, GTalkerConnectStatus, GTalkerConnectErrorType} from "./gtalker-events.js"
import {GTalker} from "./gtalker.js"
import {ByteArray} from "../common/bytearray.js"
import {Util} from "../common/util.js"
import {createESidePacket, getESideAudioBytes, int16ToUint8, uint8ToInt16} from "./talker-util.js"

import Recorder from 'recorder-core'
import 'recorder-core/src/engine/mp3'
import 'recorder-core/src/engine/mp3-engine'

const AudioBufLen = 640;
const AudioSampleRate = 8000;
const AudioQuickDelay = 1.5;
const AudioDropDelay = 3;
const AudioCacheMaxTime = 4;
const DebugFlag = false;

export class WebSocketTalker extends GTalker {

    constructor () {
        super('websocket-talker');
        this.TAG = 'WebSocketTalker';

        this.downUrl = null;
        this.upUrl = null;
        this.imei = null;
        this.channel = null;
        this.config = null;

        this.recorder = null;
        this.sender = null;
        this.element = null;
        this.audioContext = null;
        this.callbackConnectStatus = null;

        this.byteArray = new ByteArray();

        this.timerCheck = null;
        this.timerSend = null;
        this.timerReceive = null;

        this.hasReceiveServerData = false;
        this.hasSendClientData = false;
        this.hasConnectSuccess = false;
        this.hasConnectTerminalError = false;
        this.hasWaitOpenMicrophoneTimeout = false;
        this.hasDestory = false;
        this.sequence = 0;
        this.startTimestamp = 0;

        this.scheduleTime = 0;
        this.needQuick = false;
        this.cacheSource = [];
        this.cacheTime = 0;
    }

    static isSupported() {
        if (typeof window === 'undefined') {
            return false;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        return typeof WebSocket !== 'undefined' && Recorder.Support() && !!AudioContextClass;
    }

    init(downUrl, upUrl, imei, channel, config) {
        this.downUrl = downUrl;
        this.upUrl = upUrl;
        this.imei = imei;
        this.channel = parseInt(channel, 10);
        this.config = config || {};
        return this._checkInputParam();
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
    }

    load() {
        this._startAudioContext();
        this._startSender(this.upUrl);
    }

    destroy() {
        this.hasDestory = true;
        this._destroyReceiveTimer();
        this._destroySender();
        this._destroyRecorder();
        this._destroySendProc();
        this._destroyAudioContext();
        this.element = null;
        this.callbackConnectStatus = null;
    }

    _checkInputParam() {
        if (Util.isEmptyString(this.upUrl)) {
            return false;
        }
        if (!isFinite(this.channel) || Math.floor(this.channel) !== this.channel ||
            this.channel < 0 || this.channel > 255) {
            return false;
        }
        return true;
    }

    _startAudioContext() {
        if (this.audioContext != null || typeof window === 'undefined') {
            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return;
        }

        try {
            this.audioContext = new AudioContextClass({sampleRate: AudioSampleRate});
        }
        catch (e) {
            this.audioContext = new AudioContextClass();
        }

        if (this.audioContext.resume) {
            this.audioContext.resume();
        }
    }

    _startSender(url) {
        this._destroySender();
        this.sender = new WebSocket(url);
        this.sender.binaryType = 'arraybuffer';
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
        this._destroyReceiveTimer();
        this.timerReceive = setTimeout(this._timeoutCheckIfReceiveAudio.bind(this), 10000);
    }

    _onSenderMsg(e) {
        if (!(e.data instanceof ArrayBuffer)) {
            return;
        }

        const audioBytes = getESideAudioBytes(e.data);
        if (audioBytes.length === 0) {
            return;
        }

        this.hasReceiveServerData = true;
        this._destroyReceiveTimer();
        this._notifyConnectSuccess();

        this._onAudioSample(uint8ToInt16(audioBytes));
    }

    _onSenderClose(e) {
        if (DebugFlag) {
            console.log("websocket close", e);
        }

        if (this.hasReceiveServerData) {
            this._notifyConnectError(GTalkerConnectErrorType.DeviceStopedResponding, true);
        }
        else {
            this._notifyConnectError(GTalkerConnectErrorType.UpLinkFail, true);
        }
    }

    _onSenderError(e) {
        if (DebugFlag) {
            console.log("websocket error", e);
        }
    }

    _timeoutCheckIfReceiveAudio() {
        if (this.hasReceiveServerData) {
            return;
        }

        this._notifyConnectError(GTalkerConnectErrorType.DeviceNotResponding, true);
    }

    _destroySender() {
        if (this.sender != null) {
            this.sender.onopen = null;
            this.sender.onmessage = null;
            this.sender.onclose = null;
            this.sender.onerror = null;
            try {
                this.sender.close();
            }
            catch (e) {
                if (DebugFlag) {
                    console.log("websocket close error", e);
                }
            }
            this.sender = null;
        }
    }

    _startRecorder() {
        if (this.recorder != null) {
            this.recorder.close();
        }

        this.recorder = Recorder({
            type:"mp3",
            sampleRate:AudioSampleRate,
            bitRate:16,
            onProcess:this._onReceiveMicrophoneData.bind(this)
        });
        this.timerCheck = setTimeout(this._timeoutCheckIfAllowOpenMicrophone.bind(this), 10000);
        this.recorder.open(this._onAllowOpenMicrophone.bind(this),
            this._onNotAllowOpenMicrophone.bind(this));
    }

    _timeoutCheckIfAllowOpenMicrophone() {
        if (DebugFlag) {
            console.log("user WaitOpenMicrophone Timeout");
        }

        this.hasWaitOpenMicrophoneTimeout = true;
        this._notifyConnectError(GTalkerConnectErrorType.WaitOpenMicrophoneTimeout, true);
    }

    _onAllowOpenMicrophone() {
        if (DebugFlag) {
            console.log("user AllowOpenMicrophone");
        }

        if (this.hasWaitOpenMicrophoneTimeout) {
            return;
        }

        clearTimeout(this.timerCheck);
        this.timerCheck = null;

        if (this.hasDestory || this.hasConnectTerminalError || this.recorder == null) {
            return;
        }

        this.hasSendClientData = true;
        this.startTimestamp = Date.now();
        this.recorder.start();

        if (!this.hasDestory) {
            this._notifyConnectSuccess();
            this._sendProc();
        }
    }

    _onNotAllowOpenMicrophone(msg, isUserNotAllow) {
        if (DebugFlag) {
            console.log("user NotAllowOpenMicrophone", msg, isUserNotAllow);
        }

        this._notifyConnectError(GTalkerConnectErrorType.NotAllowOpenMicrophone, true);
    }

    _onReceiveMicrophoneData(buffers, powerLevel, bufferDuration, bufferSampleRate) {
        if (buffers.length === 0) {
            return;
        }

        this.byteArray.push(int16ToUint8(buffers[buffers.length - 1]));
    }

    _destroyRecorder() {
        if (this.recorder != null) {
            try {
                this.recorder.close();
            }
            catch (e) {
                if (DebugFlag) {
                    console.log("recorder close error", e);
                }
            }
            this.recorder = null;
        }
        clearTimeout(this.timerCheck);
        this.timerCheck = null;
    }

    _sendProc() {
        if (this.hasDestory || this.hasConnectTerminalError) {
            return;
        }

        if (this.byteArray.length < AudioBufLen) {
            this.timerSend = setTimeout(this._sendProc.bind(this), 5);
            return;
        }

        const audioBuf = this.byteArray.readBytes(AudioBufLen);
        const packet = createESidePacket({
            audioBytes: audioBuf,
            sequence: this.sequence,
            channel: this.channel,
            timestamp: Date.now() - this.startTimestamp
        });
        this.sequence = (this.sequence + 1) & 0xffff;

        if (this.sender != null && this.sender.readyState === WebSocket.OPEN) {
            this.sender.send(packet);
        }

        this._sendProc();
    }

    _destroySendProc() {
        clearTimeout(this.timerSend);
        this.timerSend = null;
    }

    _destroyReceiveTimer() {
        clearTimeout(this.timerReceive);
        this.timerReceive = null;
    }

    _notifyConnectError(errorType, stopSession) {
        if (this.hasDestory || this.hasConnectTerminalError) {
            return;
        }

        this.hasConnectTerminalError = true;
        this._destroyReceiveTimer();
        clearTimeout(this.timerCheck);
        this.timerCheck = null;

        if (stopSession) {
            this._destroySendProc();
            this._destroyRecorder();
            this._destroySender();
        }

        if (this.callbackConnectStatus != null) {
            this.callbackConnectStatus(GTalkerConnectStatus.ConnectError, errorType);
        }
    }

    _notifyConnectSuccess() {
        if (!this.hasReceiveServerData || !this.hasSendClientData || this.hasConnectSuccess ||
            this.hasConnectTerminalError || this.hasDestory || this.callbackConnectStatus == null) {
            return;
        }

        this.hasConnectSuccess = true;
        this.callbackConnectStatus(GTalkerConnectStatus.ConnectSuccess, "");
    }

    _onAudioSample(buffer) {
        if (this.audioContext == null || buffer.length === 0) {
            return;
        }

        const audioBufferObj = this.audioContext.createBuffer(1, buffer.length, this.audioContext.sampleRate);
        const audioBuffer = audioBufferObj.getChannelData(0);
        for (let i = 0; i < buffer.length; ++i) {
            audioBuffer[i] = buffer[i] / 32768.0;
        }

        const audioSrc = this.audioContext.createBufferSource();
        audioSrc.buffer = audioBufferObj;
        audioSrc.connect(this.audioContext.destination);

        const currentTime = this.audioContext.currentTime;
        let duration = audioBufferObj.duration;
        if (currentTime >= this.scheduleTime) {
            this.scheduleTime = currentTime;
            this.needQuick = false;
        }
        else {
            const delay = this.scheduleTime - currentTime;
            if (delay >= AudioDropDelay) {
                this._clearCachedSources();
                this.scheduleTime = currentTime;
                this.needQuick = false;
            }
            else if (this.needQuick || delay >= AudioQuickDelay) {
                this.needQuick = true;
                audioSrc.playbackRate.value = 1.2;
                duration = duration / 1.2;
            }
        }

        this._playChunk(audioSrc, this.scheduleTime);
        this.scheduleTime += duration;
        this._cacheSource(audioSrc, duration);
    }

    _playChunk(audioSrc, scheduleTime) {
        if (audioSrc.start) {
            audioSrc.start(scheduleTime);
        }
        else {
            audioSrc.noteOn(scheduleTime);
        }
    }

    _cacheSource(audioSrc, duration) {
        this.cacheSource.push({
            source: audioSrc,
            duration: duration
        });
        this.cacheTime += duration;

        while (this.cacheTime > AudioCacheMaxTime && this.cacheSource.length > 0) {
            const cached = this.cacheSource.shift();
            this.cacheTime -= cached.duration;
        }
    }

    _clearCachedSources() {
        this.cacheSource.forEach(cached => {
            const source = cached.source;
            try {
                if (source.stop) {
                    source.stop(0);
                }
                else {
                    source.noteOff(0);
                }
            }
            catch (e) {
                if (DebugFlag) {
                    console.log("audio source stop error", e);
                }
            }
        });
        this.cacheSource = [];
        this.cacheTime = 0;
    }

    _destroyAudioContext() {
        this._clearCachedSources();
        this.scheduleTime = 0;
        this.needQuick = false;
        if (this.audioContext != null && this.audioContext.close) {
            this.audioContext.close();
        }
        this.audioContext = null;
    }
}
