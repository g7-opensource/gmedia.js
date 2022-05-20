import Recorder from 'recorder-core';
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';
import 'recorder-core/src/extensions/waveview';

export default class GRecord {
    constructor({
        type = 'mp3',
        bitRate = 16,
        sampleRate = 8000,
        audio,
        waveviewOption = {},
        limitDuration = 2 * 60 * 1000,
        onProcess = () => {},
        onStop = () => {},
    }) {
        this.type = type;
        this.bitRate = bitRate;
        this.sampleRate = sampleRate;      
        this.recorder = null;
        this.wave = null; 
        this.audio = audio;
        this.list = [];
        this.waveviewOption = waveviewOption;
        this.limitDuration = limitDuration;
        this.onProcess = onProcess.bind(this);
        this.onStop = onStop.bind(this);
    }

    open(callback) {
        this.recorder = Recorder({
            type: this.type,
            bitRate: this.bitRate,
            sampleRate: this.sampleRate,
            onProcess: (buffers, powerLevel, duration, sampleRate) => {
                if (this.wave) {
                    this.wave.input(buffers[buffers.length - 1], powerLevel, sampleRate);
                }
                // 限制最大时长
                if (duration >= this.limitDuration) {
                    this.stop((err, { blob, duration }) => {
                        if (!err) {
                            this.onStop({
                                blob, duration
                            });
                        }
                    });
                }
                if (typeof this.onProcess === 'function') {
                    this.onProcess(buffers, powerLevel, duration, sampleRate);
                }
            },
        });
        this.recorder.open(() => {
            if (this.waveviewOption && this.waveviewOption.elem) {
                this.wave = Recorder.WaveView({ elem: this.waveviewOption.elem });
            }
            callback('', {
                type: this.type,
                sampleRate: `${this.sampleRate}hz`,
                bitRate: `${this.bitRate}kbps`,
            });
        }, (msg, isUserNotAllow) => {            
            callback({
                code: 1000004,
                msg: `${isUserNotAllow ? 'UserNotAllow，' : ''}打开失败：${msg}`,
            });
        });
        return this.recorder;
    }

    close(callback) {
        if (this.recorder) {
            this.recorder.close();
            callback('');
        } else {
            callback({
                code: 100001,
                msg: '未打开录音',
            });
        }
        this.recorder = null;
    }

    start(callback) {
        if (!this.recorder || !Recorder.IsOpen()) {
            callback({
                code: 100001,
                msg: '未打开录音',
            });
            return;
        }

        this.recorder.start();
        const set = this.recorder.set;
        callback('', {
            type: set.type,
            sampleRate: `${set.sampleRate}hz`,
            bitRate: `${set.bitRate}kbps`,
        });
    }

    pause(callback) {
        if (this.recorder && Recorder.IsOpen()) {
            this.recorder.pause();
            callback();
        } else {
            callback({
                code: 100001,
                msg: '未打开录音',
            });
        }
    }

    resume(callback) {
        if (this.recorder && Recorder.IsOpen()) {
            this.recorder.resume();
            callback();
        } else {
            callback({
                code: 100001,
                msg: '未打开录音',
            });
        }
    }

    stop(callback) {
        if (!(this.recorder && Recorder.IsOpen())) {
            callback({
                code: 100001,
                msg: '未打开录音',
            });
            return;
        }
        this.recorder.stop((blob, duration) => {
            this.list.splice(0, 0, {
                blob,
                duration,
                rec: this.recorder,
            });
            callback('', {
                blob,
                duration,
                rec: this.recorder,
            });
        }, (msg) => {
            callback({
                code: 100002,
                msg: `录音失败：${msg}`,
            });
        });
    }

    down(data) {
        let href = '';
        let name = '';
        if (typeof data === 'string') {
            href = data;
            name = `${+new Date()}`;
        } else {
            const { blob, duration, rec } = data;
            rec.set = rec.set || {};
            name = `rec-${duration}ms-${(rec.set.bitRate || '-')}kbps-${(rec.set.sampleRate || '-')}hz.${(rec.set.type || (/\w+$/.exec(blob.type) || [])[0] || 'unknown')}`;
            // eslint-disable-next-line no-undef
            href = (window.URL || webkitURL).createObjectURL(blob);
        }
        
        const downA = document.createElement('a');        
        downA.href = href;
        downA.download = name;
        downA.click();
    }
}
