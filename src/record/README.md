# GRecord 使用说明
用于录音功能，依赖于recorder-core

## 调用示例
``` javascript
new gmediajs.GRecord({
	type: 'mp3', 
	sampleRate: 8000,
	bitRate: 16,
	limitDuration: 5 * 1000,
	waveviewOption: {
		elem: '.recwave'
	},
	onStop(data) {
		
		console.log("已录制mp3："+data.duration+"ms "+data.blob.size+"字节，可以点击播放、上传了",2);
	},
	onProcess(buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd) {
		console.log('onprogess', buffers, powerLevel, duration, sampleRate);
		// document.querySelector(".recpowerx").style.width=powerLevel+"%";
		// document.querySelector(".recpowert").innerText=bufferDuration+" / "+powerLevel;
	}
});
```

## 初始化参数说明
|参数名  |参数说明 |参数类型 |默认值 |说明
| --- | --- | --- | --- | ---|
|type  | 录音类型 | mp3 |mp3 |目前仅支持mp3  |
|sampleRate  | 采样率 |  number| 8000 |单位hz|
|bitRate  |  比特率| number | 16 |单位kbps|
|limitDuration  |最长录音时长  |number| 2分钟  | 超出这个值限制会自动停录音，并执行onStop的回调 |
|waveviewOption  | 声波配置 |object| 无 | 见recorder waveview 参数，elem 参数可以指定音频波展示区块 |
|onStop  | 超过最长录音时长停止播放的回调方法 |function|无  | 接收参数 { duration, blob, } |
|onProcess|播放时的process方法|function|无| 接收参数{buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd}|

实例方法说明
|方法名  |方法说明 |参数说明 | 
| --- | --- | --- |
|open|调用open打开录音请求好录音权限 |callback: (err, { type, sampleRate, bitRate}) => {}|
|close|关闭录音，释放资源|callback: (err) => {}|
|start|开始录音|callback: (err, { type, sampleRate, bitRate}) => {}|
|pause|暂停录音|callback: (err) => {}|
|resume|继续录音|callback: (err) => {}|
|stop|停止录音|callback: (err, { blob, duration, recorder}) => {}|
|down|下载录音|({ blob, duration, recorder}) => {}, (url) => {} 支持传递一个包含blob的对象，或者一个音频url|