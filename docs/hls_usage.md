客户端获取HLS协议播放使用资源情况（包含流量速度）方法
==========

#### 1. 获取sessionid
平台返回的hls播放串为：http://ip:port/hls/appname/streamname.m3u8?sessionid=xxx
客户端调用平台openApi获取到hls播放串后需要从播放串中解析出sessionid,示例：
```js
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
```

#### 2. 使用hls播放串播放视频
使用平台返回的hls地址（不要做修改，如：http://ip:port/hls/appname/streamname.m3u8?sessionid=xxx）播放即可

#### 3. 发送消费hls使用情况（包含流量速度）指令
平台会返回名叫helpUrl的websocket协议辅助串，
使用helpUlr与平台建立连接，并在连接建立成功(onopen事件触发)后发送指令，示例：
```js
_sendConsumeHlsUsageCmd(sessionid) {
    let head = {}
    head["cmd"] = "consume";
    head["type"] = "hlsusage";
    head["id"] = sessionid;
    head["data"] = {};

    let msg = JSON.stringify(head);

    this.connect.send(msg);
}
```

### 4. 接受hls使用情况（包含流量速度）数据
在helpUrl连接的onmessage事件回调函数中获取，示例：
```js
_onConnectMessage(e) {
    let head = JSON.parse(e.data);
    if (head == null || head.type == null) {
        return;
    }

    if (head.type == "hlsusage") {
        let hlsUsage = head.data;
        console.log(hlsUsage.speed + 'kB/s');
    }
}
```