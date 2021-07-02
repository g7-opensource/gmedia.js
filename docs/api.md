
gmedia.js API
==========

## Interfaces

Functions:
- [gmediajs.createPlayer()](#gmediajscreateplayer)
- [gmediajs.isHttpFlvSupported()](#gmediajsishttpflvsupported)
- [gmediajs.createTalker()](#gmediajscreatetalker)
- [gmediajs.isTalkSupported()](#gmediajsistalksupported)
- [gmediajs.createHelper()](#gmediajscreatehelper)

Classes:
- [gmediajs.GPlayer](#gmediajsgplayer)
- [gmediajs.GTalker](#gmediajsgtalker)
- [gmediajs.GHelper](#gmediajsghelper)

Enums:
- [gmediajs.GPlayerEvent](#gmediajsgplayerevent)
- [gmediajs.GErrorType](#gmediajsgerrortype)
- [gmediajs.GPlaybackControlStatus](#gmediajsgplaybackcontrolstatus)
- [gmediajs.GTalkerEvent](#gmediajsgtalkerevent)
- [gmediajs.GTalkerConnectStatus](#gmediajsgtalkerconnectstatus)
- [gmediajs.GTalkerConnectErrorType](#gmediajsgtalkerconnecterrortype)
- [gmediajs.GHelperEvent](#gmediajsghelperevent)


### gmediajs.createPlayer()
```js
function createPlayer(url:string, config:Object): GPlayer;
```

参数:
    url:平台返回的播放地址
    config:json对象，可不传，配置播放器可选项
返回值:
    GPlayer对象，用于开始结束以及控制播放


### gmediajs.isHttpFlvSupported()
```js
function isHttpFlvSupported(): boolean;
```

返回值:返回是否支持httpflv协议


### gmediajs.createTalker()
```js
function createTalker(downUrl:string, upUrl:string, imei:string, channel:string, config:Object): GTalker;
```

参数:
    downUrl:平台推送设备音频到客户端的地址
    upUrl:客户端上传音频的地址
    imei:设备的唯一编号
    channel:设备通道号
    config:json对象，可不传，配置对讲器可选项
返回值:
    GTalker对象，用于开始或结束语音对讲


### gmediajs.isTalkSupported()
```js
function isTalkSupported(): boolean;
```

返回值:返回是否支持语音对讲

### gmediajs.createHelper()
```js
function createHelper(helpUrl:string, config:Object): GHelper;
```

参数:
    helpUrl:平台推送设备音频到客户端的地址
    config:json对象，可不传，配置助手可选项
返回值:
    GHelper对象，用于获取流媒体播放状态等

### gmediajs.GPlayer
```typescript
interface GPlayer {
    constructor(): GPlayer;
    on(event: string, listener: Function): void;
    off(event: string): void;
    attachMediaElement(element: HTMLMediaElement): void;
    load(): void;
    destroy(): void;
    capture(): string;
    pause(): boolean;
    resume(): boolean; 
    seekToNewestTime(): void;
    seek(time:int): boolean; 
}
```

```js
player.on(gmediajs.GPlayerEvent.PLAYBACK_CONTROL_EVENT,(status, detail)=>{
    console.log('status ' + status + ' ' + detail);
});
```
功能:注册监听事件，目前一个事件类型仅支持一个回调函数，新的会覆盖旧的
参数:
    event:事件类型，值应该是gmediajs.GPlayerEvent枚举中的一个
    listener:接受事件的回调函数，回调函数参数个数以及内容随事件类型变化
返回值:
    无

```js
player.off(gmediajs.GPlayerEvent.PLAYBACK_CONTROL_EVENT);
```
功能:注销监听事件
参数:
    event:事件类型，值应该是gmediajs.GPlayerEvent枚举中的一个
返回值:
    无

```js
var element = document.getElementsByName('idVideo')[0];
player.attachMediaElement(element);
```
功能:给播放器附加h5 video标签对象
参数:
    element:h5 video标签对象
返回值:
    无

```js
player.load();
```
功能:开始播放,应该在调用attachMediaElement后使用
参数:
    无
返回值:
    无

```js
player.destroy();
```
功能:停止播放，并销毁所有占用的播放器资源
参数:
    无
返回值:
    无

```js
let pngUrl = player.capture();
```
功能:截图
参数:
    无
返回值:
    字符串形式，png格式，以base64编码的图片，可用于赋值给img标签src,或赋值给video标签poster用于预显示图片，或用于保存到本地，或上传到服务器

```js
let bRes = player.pause();
```
功能:暂停播放
参数:
    无
返回值:
    bool，true:需要调用后台暂停播放接口，false:不需要调用后台暂停播放接口，目前只会返回false

```js
let bRes = player.resume();
```
功能:恢复播放
参数:
    无
返回值:
    bool，true:需要调用后台恢复播放接口，false:不需要调用后台恢复播放接口，目前只会返回false

```js
player.seekToNewestTime();
```
功能:实时视频，先暂停再恢复播放后，可用于跳转到最新的缓存时间
参数:
    无
返回值:
    无

```js
let bRes = player.seek(time);
```
功能:历史视频回放，跳转播放时间
参数:
    time:准备跳转到的时间，单位秒，以开始播放时间为0起点；
    比如回放2021-04-28 10:00:00到2021-04-28 10:30:00时间段的录像，跳转到2021-04-28 10:10:00那么就穿600，
    再次跳转到2021-04-28 10:05:00就传300。
返回值:
    bool，true:需要调用后台跳转播放接口，false:不需要调用后台跳转播放接口


### gmediajs.GPlayerEvent

一系列播放器事件的枚举，可以通过 `GPlayer.on()` / `GPlayer.off()` 注册/注销监听

| Event                     | Description                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| ERROR                     | 播放器出现不可恢复错误。包含网络连接出错，音视频解码渲染出错。网络连接出错发生在还未正常播放过表示平台未收到设备推流，发生在正常播放过程中表示客户端和流媒体平台网络连接出错|
| MEDIA_SOURCE_END          | 平台推流结束事件。有过正常推流然后结束了推流才会触发。可能推流速度比播放速度快，因此并不表示播放结束|
| TIMEUPDATE                | 当前播放时间更新事件，可用于实时视频和历史视频回放显示当前播放时间                                 |
| STATISTICS_INFO           | 统计信息更新事件，可用于获取网络流量，如需其他信息可以提要求                                        |
| PLAYBACK_CONTROL_EVENT    | 历史视频回放控制命令响应情况事件，可用于获取响应开始，响应中，响应成功，响应失败的信息              | 

### gmediajs.GErrorType

gmediajs.GPlayerEvent.ERROR响应事件的错误类型，为回调函数第一个参数的值

| type             | detail                                             |
| ---------------- | -------------------------------------------------- |
| NETWORK_ERROR    | 网络错误                                           |
| MEDIA_ERROR      | 音视频解码渲染出错                                 |
| OTHER_ERROR      | 其他错误                                           |

### gmediajs.GPlaybackControlStatus

gmediajs.GPlayerEvent.PLAYBACK_CONTROL_EVENT响应事件的响应类型，为回调函数第一个参数的值

| status        | detail                                             |
| ------------- | -------------------------------------------------- |
| SeekStart     | 开始跳转播放时间                                   |
| SeekFail      | 跳转播放时间失败                                   |
| SeekSuccess   | 跳转播放时间成功                                   |

### gmediajs.GTalker
```typescript
interface GTalker {
    constructor(): GTalker;
    attachMediaElement(element: HTMLMediaElement): void;
    load(): void;
    destroy(): void;
    on(event: string, listener: Function): void;
    off(event: string): void;
}
```

```js
var element = document.getElementsByName('idAudio')[0];
talker.attachMediaElement(element);
```
功能:给对讲器附加h5 audio标签对象用于播放音频
参数:
    element:h5 audio标签对象
返回值:
    无

```js
talker.load();
```
功能:开始对讲,应该在调用attachMediaElement后使用
参数:
    无
返回值:
    无

```js
talker.destroy();
```
功能:停止对讲，并销毁所有占用的对讲器资源
参数:
    无
返回值:
    无

```js
talker.on(gmediajs.GTalkerEvent.CONNECT_STATUS, (connect_status, connect_error_type)=>{
    log("OnGTalkerEvent: " + connect_status + "  " + connect_error_type);
});
```
功能:注册监听事件，目前一个事件类型仅支持一个回调函数，新的会覆盖旧的
参数:
    event:事件类型，值应该是gmediajs.GTalkerEvent枚举中的一个
    listener:接受事件的回调函数，回调函数参数个数以及内容随事件类型变化
返回值:
    无

```js
talker.off(gmediajs.GTalkerEvent.CONNECT_STATUS);
```
功能:注销监听事件
参数:
    event:事件类型，值应该是gmediajs.GTalkerEvent枚举中的一个
返回值:
    无

### gmediajs.GTalkerEvent

一系列对讲器事件的枚举，可以通过 `GTalker.on()` / `GTalker.off()` 注册/注销监听

| Event                     | Description                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| CONNECT_STATUS            | 语音对讲双防建立连接的状态，取值为GTalkerConnectStatus枚举                                         |

### gmediajs.GTalkerConnectStatus

gmediajs.GTalkerEvent.CONNECT_STATUS响应事件的状态类型，为回调函数第一个参数的值

| type             | detail                                             |
| ---------------- | -------------------------------------------------- |
| ConnectSuccess   | 对讲双方建立连接成功                                |
| ConnectError     | 对讲双方建立连接失败                                |

### gmediajs.GTalkerConnectErrorType

gmediajs.GTalkerEvent.CONNECT_STATUS响应事件的连接失败原因，为回调函数第二个参数的值

| subtype                   | detail                                             |
| ------------------------- | -------------------------------------------------- |
| DeviceNotResponding       | 设备未响应语音对讲请求                             |
| DeviceStopedResponding    | 设备已停止上传音频数据                             |
| DownLinkFail              | 下行连接（客户端拉取设备音频连接）网络连接出错      |
| UpLinkFail                | 上行连接（客户端上传音频连接）网络连接出错          |
| WaitOpenMicrophoneTimeout | 等待用户允许打开麦克风超时（10秒）                  |
| NotAllowOpenMicrophone    | 用户拒绝打开麦克风                                  |

### gmediajs.GHelper
```typescript
interface GHelper {
    constructor(): GHelper;
    destroy(): void;
    on(event: string, listener: Function): void;
    off(event: string): void;
}
```

```js
helper.destroy();
```
功能:销毁助手
参数:
    无
返回值:
    无

```js
helper.on(gmediajs.GHelperEvent.MEDIA_STATE,(json)=>{
    consol.log(json.state);     //状态码
    consol.log(json.desc);      //状态描述
    consol.log(json.detail);    //状态详情
});
```
功能:注册监听事件，目前一个事件类型仅支持一个回调函数，新的会覆盖旧的
参数:
    event:事件类型，值应该是gmediajs.GHelperEvent枚举中的一个
    listener:接受事件的回调函数，回调函数参数个数以及内容随事件类型变化
返回值:
    无

```js
helper.off(gmediajs.GHelperEvent.MEDIA_STATE);
```
功能:注销监听事件
参数:
    event:事件类型，值应该是gmediajs.GHelperEvent枚举中的一个
返回值:
    无

### gmediajs.GHelperEvent

一系列助手事件的枚举，可以通过 `GHelper.on()` / `GHelper.off()` 注册/注销监听

| Event                     | Description                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| MEDIA_STATE               | 获取流媒体播放状态信息，比如设备响应情况，有无推流等                                               |

### gmediajs.GHelperEvent.MEDIA_STATE

流媒体播放状态，回调数据为json结构，含state desc detail 三个属性，详情如下

|状态值state     |描述desc                         |详情detail                                                                  |
| ---------------|---------------------------------|--------------------------------------------------------------------------- |
|0               |等待设备回应                     |等待设备回应                                                                 |
|1               |设备超时未回应请求               |设备超过8秒未回应请求                                                        |
|2               |设备回应请求不支持               |设备回应请求不支持                                                           |
|3               |设备回应请求参数错误             |设备回应请求参数错误，请检查通道号等是否错误                                  |
|4               |设备回应当前不能响应请求         |设备回应当前不能响应请求，请检查设备是否休眠                                  |
|5               |设备回应没有该通道这段时间的录像 |设备回应没有该通道这段时间的录像                                              |
|6               |设备回应请求成功                 |设备回应请求成功                                                              |
|7               |设备超时未推流                   |设备超过8秒未推流                                                             |
|8               |收到视频流                       |收到视频流                                                                    |
|9               |收到音频流                       |收到音频流                                                                    |
|10              |播放已结束                       |播放已结束                                                                    |