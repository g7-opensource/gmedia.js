# 语音对讲使用说明

本文档用于说明[开放平台语音对讲接口](https://openapi.huoyunren.com/app/docopenapi/#/productCenter/restApi/detail?uri=%2Fv1%2Fapi%2Fmessage%2Fintercom_by_channel&method=GET&id=1269)返回字段的使用方式，以及 H5、微信小程序、手机 APP 原生开发三类客户端的接入方式。

## 1. 接口返回字段说明

接口返回示例：

```json
{
  "code": 0,
  "data": {
    "callId": "150081414485123073",
    "http_flv": "http://39.106.82.213:80/live?app=g7-jt808",
    "channel_no": 1,
    "helpUrl": "wss://stream.test.chinawayltd.com:4236/ws/g7-jt8",
    "imei": "96115",
    "gpsno": "410512",
    "hls_url": "http://39.106.82.213:80/hls/g7-jt808-speech/999",
    "request_id": "5e9c153ecaefd354e2496be2163",
    "rtm_url": "rtmp://39.106.82.213:1935/live/g7-jt808",
    "ws_url": "wss://stream.test.chinawayltd.com:4236/ws/g7-jt808",
    "speech_url": "wss://stream.test.chinawayltd.com/e_imei_channel"
  },
  "msg": "succ",
  "req_id": "f8a00265cc387c1c0009f",
  "sub_code": 0,
  "sub_msg": "success"
}
```

`data` 中语音对讲接入需要使用的关键字段介绍：

| 字段 | 说明 | 典型使用方 |
| --- | --- | --- |
| `callId` | 一次语音对讲请求的唯一 ID，可用于调用[语音对讲记录接口](https://openapi.huoyunren.com/app/docopenapi/#/productCenter/restApi/detail?uri=%2Fv1%2Fapi%2Fmedia%2Fstorage%2Ffind_storage_infos&method=GET&id=1282)查询对讲录音。 | 业务系统用于关联和查询本次对讲录音。 |
| `speech_url` | websocket 协议URL，传输上行和下行音频，数据协议为私有头, 音频编码为PCM。 | 用于H5客户端 |
| `http_flv` | HTTP 协议URL，传输下行音频，数据协议为 FLV，音频编码为 ACC。 | 用于APP |
| `rtm_url` | RTMP 协议URL，传输下行音频，数据协议为 FLV，音频编码为 ACC。 | 用于微信小程序或APP |
| `ws_url` | websocket 协议URL，传输上行音频，数据协议为私有头，音频编码为 PCM。 | 用于微信小程序和APP |

如果接口返回字段名和本文档示例不同，应以开放平台接口实际返回为准。

## 2. H5 实现方式

H5 应使用 [`gmedia.js`](https://github.com/g7-opensource/gmedia.js) 创建语音对讲器。`gmedia.js` 仅支持 H5 应用，依赖 DOM、`audio` 标签、MSE、Web Audio API、WebSocket 和浏览器麦克风权限，不能直接运行在微信小程序或手机 APP 原生环境中。

### 2.1 H5 框架图

| 设备 | 平台 | H5 客户端 |
| --- | --- | --- |
| 与平台建立语音通道。 | 下行音频：通过 `speech_url` websocket 发送到 H5。 | 使用 `gmedia.js` 接收并播放下行音频。 |
| 接收平台转发的客户端语音。 | 上行音频：通过 `speech_url` websocket 接收 H5 上传音频并转发到设备。 | 使用 `gmedia.js` 连接麦克风 / 扬声器，采集并播放音频。 |

### 2.2 H5使用gmedia.js创建语音对讲关键步骤

1. 由业务系统调用开放平台接口，H5 页面获取接口返回的 `data.speech_url`。
2. 使用 `gmediajs.isTalkSupported()` 判断当前浏览器是否支持语音对讲。
3. 调用 `gmediajs.createTalker(speechUrl, speechUrl, null, null)` 创建对讲器。
4. 调用 `talker.on(gmediajs.GTalkerEvent.CONNECT_STATUS, listener)` 监听连接状态。
5. 调用 `talker.attachMediaElement(audioElement)` 绑定 H5 `audio` 标签。
6. 调用 `talker.load()` 开始对讲。
7. 结束对讲时调用 `talker.destroy()` 结束对讲和释放资源。

完整示例见 [demo/talk.html](https://github.com/g7-opensource/gmedia.js/blob/master/demo/talk.html)。

### 2.3 关键方法说明

```js
gmediajs.createTalker(downUrl, upUrl, imei, channel, config)
```

| 参数 | 说明 |
| --- | --- |
| `downUrl` | 下行音频地址，来自开放平台接口返回。 |
| `upUrl` | 上行对讲地址，来自开放平台接口返回。 |
| `imei` | 保留参数，当前内部不使用，传 `null` 即可。 |
| `channel` | 保留参数，当前内部不使用，传 `null` 即可。 |
| `config` | 可选配置，当前语音对讲通常不需要传。 |

语音对讲通过注册`GTalkerEvent.CONNECT_STATUS`事件回调函数 返回连接状态。常用状态和错误枚举：

| 枚举 | 说明 |
| --- | --- |
| `GTalkerConnectStatus.ConnectSuccess` | 对讲双方建立连接成功。 |
| `GTalkerConnectStatus.ConnectError` | 对讲建立失败或连接异常。 |
| `GTalkerConnectErrorType.DeviceNotResponding` | 设备未响应语音对讲请求。 |
| `GTalkerConnectErrorType.DeviceStopedResponding` | 设备已停止上传音频数据。 |
| `GTalkerConnectErrorType.DownLinkFail` | 下行连接出错。 |
| `GTalkerConnectErrorType.UpLinkFail` | 上行连接出错。 |
| `GTalkerConnectErrorType.WaitOpenMicrophoneTimeout` | 等待用户允许打开麦克风超时。 |
| `GTalkerConnectErrorType.NotAllowOpenMicrophone` | 用户拒绝打开麦克风。 |

## 3. 微信小程序实现方式

微信小程序不能直接集成 `gmedia.js`，应使用小程序原生能力完成下行播放和上行音频上传。

### 3.1 微信小程序框架图

| 设备 | 平台 | 微信小程序 |
| --- | --- | --- |
| 与平台建立语音通道。 | 下行音频：通过 `rtm_url` RTMP 发送到小程序。 | 使用 `live-player` 播放下行音频并连接扬声器。 |
| 接收平台转发的客户端语音。 | 上行音频：通过 `ws_url` websocket 接收小程序上传音频并转发到设备。 | 使用 webAPI 录制麦克风音频，并按上行私有协议上传。 |

### 3.2 小程序整体流程

1. 用户点击“开始对讲”按钮。
2. 业务系统调用开放平台“按通道发起语音对讲”接口。
3. 从接口返回结果中获取 RTMP 协议串和 websocket 协议串。
4. 使用微信小程序 `live-player` 播放 RTMP 下行音频。
5. 使用小程序麦克风 API 采集音频。
6. 将采集到的音频按照上行私有协议格式封包。
7. 通过 websocket 协议串上传音频数据。
8. 结束对讲时停止 `live-player`、关闭麦克风采集、关闭 websocket。

### 3.3 下行播放

下行音频播放使用微信小程序原生 [`live-player`](https://developers.weixin.qq.com/miniprogram/dev/component/live-player.html) 组件：

```xml
<live-player
  src="{{rtmpUrl}}"
  mode="live"
  autoplay
  bindstatechange="onLivePlayerStateChange" />
```

### 3.4 上行音频

小程序端需要自行完成以下工作：

- 申请并处理麦克风权限。
- 从麦克风采集音频数据。
- 按照上行私有协议格式封包，详见[第5章](#5-上行私有协议格式)。
- 通过开放平台返回的 websocket 协议串上传音频数据。
- 处理 websocket 连接失败、设备无响应、用户拒绝麦克风等异常。

## 4. 手机 APP 原生实现方式

手机 APP 原生语言开发也不能直接集成 `gmedia.js`。APP 的接入方式和微信小程序类似：下行使用原生播放器播放，上行自行采集麦克风音频后通过 websocket 上传。

### 4.1 APP 框架图

| 设备 | 平台 | 手机 APP |
| --- | --- | --- |
| 与平台建立语音通道。 | 下行音频：通过 `http_flv` HTTP-FLV 或 `rtm_url` RTMP 发送到 APP。 | 自行开发或引入第三方库播放下行音频并连接扬声器。 |
| 接收平台转发的客户端语音。 | 上行音频：通过 `ws_url` websocket 接收 APP 上传音频并转发到设备。 | 自行开发或引入第三方库录制麦克风音频，并按上行私有协议上传。 |

### 4.2 APP 整体流程

1. 用户点击“开始对讲”按钮。
2. APP 或业务后端调用开放平台“按通道发起语音对讲”接口。
3. 从接口返回结果中获取 `http_flv` 或 `rtm_url` 下行播放地址，以及 `ws_url` 上行 websocket 地址。
4. 使用原生播放器或第三方 SDK 播放下行音频。
5. 使用系统麦克风 API 采集音频。
6. 将采集到的音频按照上行私有协议格式封包。
7. 通过 websocket 协议串上传音频数据。
8. 结束对讲时停止播放器、释放麦克风、关闭 websocket。

### 4.3 下行播放

APP 下行播放可使用开放平台返回的 `http_flv` 或 `rtm_url`。客户端应根据所选播放器或第三方 SDK 支持的协议选择对应地址，具体播放器初始化、缓冲策略和生命周期管理由 APP 侧实现。

### 4.4 上行音频

APP 端需要自行完成以下工作：

- 申请并处理系统麦克风权限。
- 采集麦克风音频数据。
- 按照上行私有协议格式封包，详见[第5章](#5-上行私有协议格式)。
- 通过开放平台返回的 websocket 协议串上传音频数据。
- 在页面退出、切换设备、切换通道或网络断开时释放播放器、麦克风和 websocket 资源。

## 5. 上行私有协议格式

微信小程序和 APP 使用 `ws_url` 上传麦克风音频时，数据协议为：

- 音频数据要求为 8000 Hz、单声道、16 位 PCM。
- 每20毫秒音频（320字节）作为一个音频包。
- 每个音频包前应添加如下协议头：

| 字段 | 长度 | 说明 |
| --- | --- | --- |
| 幻数 | 4 字节 | 固定为 `0x31 0x32 0x63 0x64`。 |
| IMEI | 15 字节 | 15 位 IMEI 字符串，目前平台未实际使用，可全部传 `0`。 |
| channel | 1 字节 | 固定传 `1`。 |
| 数据长度 | 2 字节 | 短整型，表示后续 PCM 音频数据长度。 |

## 6. 注意事项

- 重新开始对讲或主动结束语音对讲时，应施放旧对讲资源。
- 重新开始对讲时应重新调用开放平台接口获取新的url，不能复用旧url。
- 调用开放平台接口获取到url后，如果超过10秒未进行连接，或者连接后超过10秒平台未收到音频，平台都会主动断开对讲连接并回收平台和设备的资源。
- 网页关闭、系统关机、断网时，平台都会自动断开语音对讲连接。
