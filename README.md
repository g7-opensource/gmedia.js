gmedia.js
=========

G7 H5流媒体处理库，支持实时视频，历史视频回放，语音对讲，获取流媒体播放状态等。
在封装flv.js recoder.js第三方开源库基础上根据G7平台接入设备特性做优化完善,并支持了更丰富的功能。

## Demo
实时视频            See [realplay.html](demo/realplay.html)
历史视频回放        See [playback_plan1.html](demo/playback_plan1.html)
语音对讲            See [talk.html](demo/talk.html)
流媒体播放状态展示  See [realplay.html](demo/realplay.html) [playback_plan1.html](demo/playback_plan1.html)

## API and Configuration
See [api.md](docs/api.md)

## Build

```bash
npm install          # install dev-dependences
npm install -g gulp  # install build tool
gulp release         # packaged & minimized js will be emitted in dist folder
```

## Quick Started

```html
<script src="gmedia.min.js"></script>
<video id="idElement"></video>
<script>
    var element = document.getElementById('idElement');
    var player = gmediajs.createPlayer('http://example.com/live/video.flv');
    player.attachMediaElement(element);
    player.load();
</script>
```