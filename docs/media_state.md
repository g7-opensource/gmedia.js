不使用gmedia.js情况下，获取流媒体播放状态方法：
==========

#### 1. websocket协议连接平台
调用开放平台获取实时视频或历史视频播放串接口时，除了返回视频播放串，同时也会返回名叫helpUrl的辅助串，
如:wss://xxx.huoyunren.com:xxx/live/g7-flv-video--125013302691515--1--417126419823452161,使用
websocket协议连接此连接。

#### 2. 发送消费流媒体播放状态指令
在websocket连接建立成功(onopen事件触发)后发送指令，示例：
```js
_sendConsumeMediaStateCmd() {
    let head = {}
    head["cmd"] = "consume";
    head["type"] = "mediastate";
    head["id"] = "";
    head["data"] = {};

    let msg = JSON.stringify(head);

    this.connect.send(msg);
}
```

### 4. 接受流媒体播放状态
在websocke连接的onmessage事件中获取，示例：
```js
_onConnectMessage(e) {
    let head = JSON.parse(e.data);
    if (head == null || head.type == null) {
        return;
    }

    if (head.type == "mediastate") {
        let mediaState = head.data;
        console.log(mediaState);
    }
}
```
其中meidaState为平台发送的这次视频播放的状态及对于设备的工作状态，
详细内容见./api.md文档里的gmediajs.GHelperEvent.MEDIA_STATE定义