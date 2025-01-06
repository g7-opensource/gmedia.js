/**********************************/
//和平台网络通信方法
//仅测试环境生效
//仅用于测试
/**********************************/
//114.116.210.142 成都IDC测试环境
function getRealplayUrl(imei,channel,avitemType,streamType,callback)
{
    let url = "http://114.116.210.142:9234/vega/video/open_live?imei=" +  imei +
              "&channels=" + channel +
              "&avitemType=" + avitemType +
              "&streamType=" + streamType +
              "&hls=true&userSource=test&storage=true";
    httpGet(url,callback);
}

function getGBRealplayUrl(ipcid,callback)
{
    let url = "http://172.22.33.225:8093/e6/api/realTime/start?ipcCode=" +  ipcid;
    httpGet(url,callback);
}

function getGBTalkUrl(ipcid,callback)
{
    let url = "http://172.22.33.225:8093/e6/api/talk?ipcCode=" +  ipcid;
    httpGet(url,callback);
}

function getTalkUrl(imei,channel,callback)
{
    let url = "http://114.116.210.142:9234/vega/video/open_live?imei=" +  imei +
              "&channels=" + channel +
              "&avitemType=" + 2 + "&storage=true";
    httpGet(url,callback);
}

function getPlaybackUrl(imei,channel,start,end,callback)
{
    let url = "http://114.116.210.142:9234/vega/video/open_playback?imei=" +  imei +
              "&channels=" + channel +
              "&from=" + start +
              "&to=" + end + 
              "&avitemType=0&streamType=1&memType=1&userSource=vccs";
    httpGet(url,callback);
}

function sendPlaybackControlCmdToServer(imei,channel,control,quickType,positionTime)
{
    let url =  "http://114.116.210.142:9234/vega/video/control_playback?imei=" + imei +
        "&channels=" + channel + "&control=" + control + "&quickType=" + quickType +
        "&positionTime=" + positionTime;
    httpGet(url,(requestUrl,bOk, data)=>{});
}
  
  
  //封装http get请求
function httpGet(url, func)
{
    let request = new XMLHttpRequest();
    request.open("GET", url);
    request.timeout = 10000;
    request.onload = (event)=>{
        if(request.status!=200){
            console.log('http get not 200');
            func(url, false, null);
        }
        else {
            let data = request.response;
            func(url, true, data);
        }
    }
    request.ontimeout = (event)=>{
        console.log('http get time out');
        func(url, false, null);
    }
    request.onerror = (event)=>{
        console.log('http get error');
        func(url, false, null);
    }
    request.send();
}