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
        
    }

    _onConnectMessage(e) {
        let str = e.data;
        let json = JSON.parse(str);
        if (this.callMediaState != null) {
            this.callMediaState(json);
        }
    }

    _onConnectClose() {
        
    }

    _onConnectError() {
        
    }
}