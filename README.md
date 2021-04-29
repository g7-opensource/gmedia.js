gmedia.js
=========

G7 H5流媒体处理库，包含实时视频，历史视频回放等。
在封装flv.js hls.js等第三方开源H5播放库基础上根据G7平台接入设备特性做优化处理。

## Demo
See [index.md](demo/index.md)

## API and Configuration
See [api.md](docs/api.md)

## Build

```bash
npm install          # install dev-dependences
npm install -g gulp  # install build tool
gulp release         # packaged & minimized js will be emitted in dist folder
```

## Getting Started

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