import {GHelperEvent} from "./ghelper-events.js"
export class GHelper {
    constructor() {
        this.callMediaState = null;
        this.connect = null;
    }

    init(url) {
        this.connect = new WebSocket(url);
        this.connect.onopen = this._onConnectOpen.bind(this);
        this.connect.onmessage = this._onConnectMessage.bind(this);
        this.connect.onclose = this._onConnectClose.bind(this);
        this.connect.onerror = this._onConnectError.bind(this);
    }

    on(event, call) {
        if (event = GHelperEvent.MEDIA_STATE) {
            this.callMediaState = call;
        }
    }

    off(event) {
        if (event = GHelperEvent.MEDIA_STATE) {
            this.callMediaState = null;
        }
    }

    destroy() {
        this.callMediaState = null;

        if (this.connect != null) {
            this.connect.close();
            this.connect = null;
        }
    }

    _onConnectOpen() {
        this._sendConsumeMediaStateCmd();
    }

    _onConnectMessage(e) {
        let head = JSON.parse(e.data);
        if (head == null || head.type == null) {
            return;
        }

        if (head.type == "mediastate" && this.callMediaState != null) {
            this.callMediaState(head.data);
        }
    }

    _onConnectClose() {
        
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
}