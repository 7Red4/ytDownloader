export default class Tracker {
  constructor(id) {
    this.id = id || Date.now();
    this.info = null;

    this.start = Date.now();
    this.audio = { downloaded: 0, total: Infinity };
    this.video = { downloaded: 0, total: Infinity };
    this.merged = { frame: 0, speed: '0x', fps: 0 };

    this.isRunning = false;
    this.error = false;
  }

  setInfo(videoInfo) {
    this.info = videoInfo;
  }
}
