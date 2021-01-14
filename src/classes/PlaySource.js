const ytdl = require('ytdl-core');

import consola from 'consola';
import streamToBlob from 'stream-to-blob';

export default class PlaySource {
  constructor({ url = '', list = [] }) {
    if (url) {
      const timestamp = Date.now();
      this.id = timestamp;
      this.videoDetails = null;
      this.url = url;
      this.list = list;

      ytdl
        .getBasicInfo(url)
        .then(({ videoDetails }) => {
          this.videoDetails = videoDetails;

          const { lengthSeconds, author, title } = videoDetails;
          this.lengthSeconds = Number(lengthSeconds);
          this.author = author.name;
          this.title = title;
        })
        .catch(error => {
          consola.error(error);
        });

      streamToBlob(
        ytdl(url, {
          quality: 'highestaudio',
          filter: 'audioonly'
        })
      ).then(res => {
        this.audio = res;
        this.onBlobReadyCallback();
      });
    }
  }

  id = '';
  url = '';
  src = '';
  tag = '';
  list = [];
  videoDetails = null;
  author = '';
  title = '';
  lengthSeconds = 0;

  audio = null /* Blob */;

  onBlobReadyCallback = () => {};
  onBlobReady(callback) {
    if (this.audio) {
      callback();
    } else {
      this.onBlobReadyCallback = callback;
    }
  }
  setSrc(src) {
    this.src = src;
  }
  setTag(tag) {
    this.tag = tag;
  }
}
