const ytdl = require('ytdl-core');

import consola from 'consola';
import streamToBlob from 'stream-to-blob';

export default class PlaySource {
  constructor({ url = '', list = [] }) {
    if (url) {
      this.videoDetails = null;
      this.url = url;
      this.list = list;

      ytdl
        .getBasicInfo(url)
        .then(({ videoDetails }) => {
          this.videoDetails = videoDetails;

          const { lengthSeconds, videoId, author, title } = videoDetails;
          this.id = videoId;
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
}
