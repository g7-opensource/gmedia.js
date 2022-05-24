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
|limitDuration  |最长录音时长  |number| 2分钟 | 超出这个值限制会自动停录音，并执行onStop的回调，单位毫秒 |
|waveviewOption  | 声波配置 |object| 无 | 见下文recorder waveview 参数|
|onStop  | 超过最长录音时长停止播放的回调方法 |function|无  | 接收参数 { duration, blob, } |
|onProcess|播放时的process方法|function|无| 接收参数{buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd}|

## 实例方法说明
|方法名  |方法说明 |参数说明 | 
| --- | --- | --- |
|open|调用open打开录音请求好录音权限 |callback: (err, { type, sampleRate, bitRate}) => {} { type: 录音类型，默认为mp3 sampleRate: 采样率, bitRate：比特率 }|
|close|关闭录音，释放资源, 建议用此方法释放资源|callback: (err) => {}|
|start|开始录音|callback: (err, { type, sampleRate, bitRate}) => {} { type: 录音类型，默认为mp3 sampleRate: 采样率, bitRate：比特率 }|
|pause|暂停录音|callback: (err) => {}|
|resume|继续录音|callback: (err) => {}|
|stop|停止录音|callback: (err, { blob, duration, recorder}) => {} { blob: 录音的blob文件 duration: 录音时长 recorder: 录音对象实例 }|
|down|下载录音|({ blob, duration, recorder}) => {}, (url) => {} 支持传递一个包含blob的对象，或者一个音频url{ blob: 录音的blob文件 duration: 录音时长 recorder: 录音对象实例 }|

## 回调函数与错误码说明

整体使用 error first 的方式，如果出现异常，回调函数第一个参数返回 error 对象，否则返回空字符串，回调函数第二个参数传递录音过程相关的一些数据，具体见上文`实例方法说明 -> 参数说明`
 ``` javascript
 {
    code: 100001,
    msg: '回调错误信息'
 }
```


| 错误码 |说明  |
| --- | --- |
|  100001 | 未打开录音，一般是指未初始化recorder实例或者未调用open方法  |
|  100002 | 录音失败，结束录音出现异常会返回此错误  |
|  100004 |  未允许录音权限 | 
## 播放方式
1. 上传了的录音直接将音频链接赋值给audio.src即可播放
2. 本地的blob音频文件可通过URL.createObjectURL来生成本地链接赋值给audio.src即可播放

``` javascript
const audio = document.createElement("audio");
audio.controls = true;
document.querySelector("."+cls).appendChild(audio);
//简单利用URL生成播放地址，注意不用了时需要revokeObjectURL，否则霸占内存
audio.src=(window.URL||webkitURL).createObjectURL(recBlob.blob);
audio.play();
```

## recorder waveview 参数说明
```javascript
{
    //自动显示到dom，并以此dom大小为显示大小
    elem:"css selector" 
    //或者配置显示大小，手动把frequencyObj.elem显示到别的地方
    ,width:0 //显示宽度
    ,height:0 //显示高度
		
    // 以上配置二选一
		
    scale:2 //缩放系数，应为正整数，使用2(3? no!)倍宽高进行绘制，避免移动端绘制模糊

    ,fps:20 //绘制帧率，不可过高

    ,lineCount:30 //直方图柱子数量，数量的多少对性能影响不大，密集运算集中在FFT算法中
    ,widthRatio:0.6 //柱子线条宽度占比，为所有柱子占用整个视图宽度的比例，剩下的空白区域均匀插入柱子中间；默认值也基本相当于一根柱子占0.6，一根空白占0.4；设为1不留空白，当视图不足容下所有柱子时也不留空白
    ,spaceWidth:0 //柱子间空白固定基础宽度，柱子宽度自适应，当不为0时widthRatio无效，当视图不足容下所有柱子时将不会留空白，允许为负数，让柱子发生重叠
    ,minHeight:0 //柱子保留基础高度，position不为±1时应该保留点高度
    ,position:-1 //绘制位置，取值-1到1，-1为最底下，0为中间，1为最顶上，小数为百分比
    ,mirrorEnable:false //是否启用镜像，如果启用，视图宽度会分成左右两块，右边这块进行绘制，左边这块进行镜像（以中间这根柱子的中心进行镜像）

    ,stripeEnable:true //是否启用柱子顶上的峰值小横条，position不是-1时应当关闭，否则会很丑
    ,stripeHeight:3 //峰值小横条基础高度
    ,stripeMargin:6 //峰值小横条和柱子保持的基础距离

    ,fallDuration:1000 //柱子从最顶上下降到最底部最长时间ms
    ,stripeFallDuration:3500 //峰值小横条从最顶上下降到底部最长时间ms

    //柱子颜色配置：[位置，css颜色，...] 位置: 取值0.0-1.0之间
    ,linear:[0,"rgba(0,187,17,1)",0.5,"rgba(255,215,0,1)",1,"rgba(255,102,0,1)"]
    //峰值小横条渐变颜色配置，取值格式和linear一致，留空为柱子的渐变颜色
    ,stripeLinear:null

    ,shadowBlur:0 //柱子阴影基础大小，设为0不显示阴影，如果柱子数量太多时请勿开启，非常影响性能
    ,shadowColor:"#bbb" //柱子阴影颜色
    ,stripeShadowBlur:-1 //峰值小横条阴影基础大小，设为0不显示阴影，-1为柱子的大小，如果柱子数量太多时请勿开启，非常影响性能
    ,stripeShadowColor:"" //峰值小横条阴影颜色，留空为柱子的阴影颜色

    //当发生绘制时会回调此方法，参数为当前绘制的频率数据和采样率，可实现多个直方图同时绘制，只消耗一个input输入和计算时间
    ,onDraw:function(frequencyData,sampleRate){}
}
```