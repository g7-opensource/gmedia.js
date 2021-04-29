import {GPlayerEvent, GErrorType, GPlaybackControlStatus} from './player/gplayer-events';
import {GPlayer} from './player/gplayer.js';
import { HttpFlvPlayer } from './player/httpflv-player.js';

function createPlayer(url) {
  let player = new HttpFlvPlayer();
  player.init(url);
  return player;
}

function isHttpFlvSupported() {
  return window.MediaSource &&
        window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
}

let gmediajs = {};

gmediajs.createPlayer = createPlayer;
gmediajs.isHttpFlvSupported = isHttpFlvSupported;
gmediajs.HttpFlvPlayer = HttpFlvPlayer;
gmediajs.GPlayerEvent = GPlayerEvent;
gmediajs.GErrorType = GErrorType;
gmediajs.GPlaybackControlStatus = GPlaybackControlStatus;

export default gmediajs;