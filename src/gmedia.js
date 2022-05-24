import {GPlayerEvent, GErrorType, GPlaybackControlStatus} from './player/gplayer-events';
import {GTalkerEvent, GTalkerConnectStatus, GTalkerConnectErrorType} from './talker/gtalker-events';
import {GHelperEvent} from "./helper/ghelper-events.js";
import {GPlayer} from './player/gplayer.js';
import { HttpFlvPlayer } from './player/httpflv-player.js';
import { HlsPlayer } from './player/hls-player';
import { HttpFlvTalker } from './talker/httpflv-talker.js';
import { GHelper } from "./helper/ghelper.js";
import GRecord  from './record';

function createPlayer(url, config = null) {
  let player = null;
  if (url.indexOf(".m3u8") != -1) {
    player = new HlsPlayer();
  }
  else {
    player = new HttpFlvPlayer();
  }
  player.init(url, config);
  return player;
}

function createTalker(downUrl, upUrl, imei, channel, config = null) {
  let talker = new HttpFlvTalker();
  if (!talker.init(downUrl, upUrl, imei, channel, config)) {
    return null;
  }
  return talker;
}

function createHelper(url) {
  let helper = new GHelper();
  helper.init(url);
  return helper;
}

function isHttpFlvSupported() {
  return HttpFlvPlayer.isSupported();
}

function isHlsSupported() {
  return HlsPlayer.isSupported();
}

function isTalkSupported() {
  return HttpFlvTalker.isSupported();
}

let gmediajs = {};

gmediajs.createPlayer = createPlayer;
gmediajs.isHttpFlvSupported = isHttpFlvSupported;
gmediajs.isHlsSupported = isHlsSupported;
gmediajs.HttpFlvPlayer = HttpFlvPlayer;
gmediajs.HlsPlayer = HlsPlayer;
gmediajs.GPlayerEvent = GPlayerEvent;
gmediajs.GErrorType = GErrorType;
gmediajs.GPlaybackControlStatus = GPlaybackControlStatus;

gmediajs.createTalker = createTalker;
gmediajs.isTalkSupported = isTalkSupported;
gmediajs.HttpFlvTalker = HttpFlvTalker;
gmediajs.GTalkerEvent = GTalkerEvent;
gmediajs.GTalkerConnectStatus = GTalkerConnectStatus;
gmediajs.GTalkerConnectErrorType = GTalkerConnectErrorType;

gmediajs.createHelper = createHelper;
gmediajs.GHelper = GHelper;
gmediajs.GHelperEvent = GHelperEvent;

gmediajs.GRecord = GRecord;

export default gmediajs;