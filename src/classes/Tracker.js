export default class Tracker {
  constructor(id) {
    this.id = id || Date.now();
    this.info = null;
    this.title = '';
    this.path = '';

    this.start = this.start || Date.now();
    this.audio = { downloaded: 0, total: Infinity };
    this.video = { downloaded: 0, total: Infinity };
    this.merged = { frame: 0, speed: '0x', fps: 0 };
    this.noVideo = false;
    this.noAudio = false;

    this.isMerging = false;
    this.isRunning = false;
    this.isRecording = false;
    this.error = false;
  }

  setInfo(payload) {
    Object.keys(payload).forEach((key) => {
      this[key] = payload[key];
    });
  }
}
