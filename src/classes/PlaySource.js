const ytdl = require('ytdl-core');

import consola from 'consola';
import streamToBlob from 'stream-to-blob';

function parseYtId(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : false;
}
export default class PlaySource {
  constructor({ url = '', list = [] }) {
    if (url) {
      this.videoDetails = null;
      this.url = url;
      this.list = list;
      this.id = parseYtId(url);

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
