
gmedia.js API
==========

## Interfaces

Functions:
- [gmediajs.createPlayer()](#gmediajscreateplayer)
- [gmediajs.isHttpFlvSupported()](#gmediajsishttpflvsupported)

Classes:
- [gmediajs.HttpFlvPlayer](#gmediajshttpflvplayer)

Enums:
- [gmediajs.GPlayerEvent](#gmediajsgplayerevent)
- [gmediajs.GErrorType](#gmediajsgerrortype)
- [gmediajs.GPlaybackControlStatus](#gmediajsgplaybackcontrolstatus)




### gmediajs.createPlayer()
```js
function createPlayer(url:string): GPlayer;
```

参数:
    url:平台返回的播放地址
返回值:
    GPlayer对象，用于开始结束以及控制播放


### gmediajs.isHttpFlvSupported()
```js
function isHttpFlvSupported(): boolean;
```

返回值:返回是否支持httpflv协议

### interface GPlayer (abstract)
```typescript
interface GPlayer {
    constructor(): GPlayer;
    attachMediaElement(element: HTMLMediaElement): void;
    load(): void;
    destroy(): void;
    on(event: string, listener: Function): void;
    off(event: string): void;
    pause(): boolean;
    resume(): boolean; 
    seek(time:int): boolean; 
}
```

```js
var element = document.getElementsByName('videoElement')[0];
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
let bRes = player.seek(time);
```
功能:跳转播放时间
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

