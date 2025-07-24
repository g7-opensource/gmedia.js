import {GHelperEvent} from "./ghelper-events.js"
export class GHelper {
    constructor() {
        this.callMediaState = null;
        this.callHlsUsage = null;

        this.url = "";
        this.sessionid = "";
        this.connect = null;
        this.flag = true;
        this.timerId = null;
    }

    init(url, sessionid = "") {
        this.url = url;
        this.sessionid = sessionid;
        this.connect = new WebSocket(url);
        this.connect.onopen = this._onConnectOpen.bind(this);
        this.connect.onmessage = this._onConnectMessage.bind(this);
        this.connect.onclose = this._onConnectClose.bind(this);
        this.connect.onerror = this._onConnectError.bind(this);
    }

    on(event, call) {
        if (event == GHelperEvent.MEDIA_STATE) {
            this.callMediaState = call;
        }
        else if (event == GHelperEvent.HLS_USAGE) {
            this.callHlsUsage = call;
        }
    }

    off(event) {
        if (event == GHelperEvent.MEDIA_STATE) {
            this.callMediaState = null;
        }
        else if (event == GHelperEvent.HLS_USAGE) {
            this.callHlsUsage = null;
        }
    }

    destroy() {
        this.flag = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }

        this.callMediaState = null;
        this.callHlsUsage = null

        if (this.connect != null) {
            this.connect.close();
            this.connect = null;
        }
    }

    _onConnectOpen() {
        this._sendConsumeMediaStateCmd();
        this._sendConsumeNetSignalCmd();
        if (this.sessionid != "") {
            this._sendConsumeHlsUsageCmd(this.sessionid);
        }

        this.timerId = setTimeout(()=>{
            this._sendUpdateTimeMediaStateCmd();
        }, 20000);
    }

    _onConnectMessage(e) {
        let head = JSON.parse(e.data);
        if (head == null || head.type == null) {
            return;
        }

        if (head.type == "mediastate") {
            if (this.callMediaState != null) {
                this.callMediaState(head.data);
            }
        }
        else if (head.type == "hlsusage") {
            if (this.callHlsUsage != null) {
                this.callHlsUsage(head.data);
            }
        }
    }

    _onConnectClose() {
        this.connect = null;
        this.destroy();
    }

    _onConnectError() {
        
    }

    _sendConsumeMediaStateCmd() {
        let head = {}
        head["cmd"] = "consume";
        head["type"] = "mediastate";
        head["id"] = "";
        head["data"] = {};

        let msg = JSON.stringify(head);

        this.connect.send(msg);
    }

    _sendUpdateTimeMediaStateCmd() {
        if (!this.flag) {
            return;
        }

        let head = {}
        head["cmd"] = "updatetime";
        head["type"] = "mediastate";
        head["id"] = "";
        head["data"] = {};

        let msg = JSON.stringify(head);

        this.connect.send(msg);

        this.timerId = setTimeout(()=>{
            this._sendUpdateTimeMediaStateCmd();
        }, 20000);
    }

    _sendConsumeNetSignalCmd() {
        let head = {}
        head["cmd"] = "consume";
        head["type"] = "netsignal";
        head["id"] = "";
        head["data"] = {};

        let msg = JSON.stringify(head);

        this.connect.send(msg);
    }

    _sendConsumeHlsUsageCmd(sessionid) {
        let head = {}
        head["cmd"] = "consume";
        head["type"] = "hlsusage";
        head["id"] = sessionid;
        head["data"] = {};

        let msg = JSON.stringify(head);

        this.connect.send(msg);
    }
}