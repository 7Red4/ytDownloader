const ytdl = require('ytdl-core');
// Buildin with nodejs
import cp from 'child_process';
import os from 'os';
import PATH from 'path';
import consola from 'consola';
import fs from 'fs';
import streamToBlob from 'stream-to-blob';

// External modules
import filenamify from 'filenamify';

const appRootDir = require('app-root-dir').get();

const ffplay = PATH.join(
  appRootDir,
  'node_modules',
  'ffmpeg-static',
  os.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
);

export default class Player {
  constructor({ url, list = [] }) {
    const timestamp = Date.now();
    this.id = timestamp;
    this.filePath = PATH.join(appRootDir, 'tmp', `${timestamp}.mp3`);
    this.videoDetails = null;
    this.url = url;
    this.list = list;

    // folder check
    if (!fs.existsSync(PATH.join(appRootDir, 'tmp'))) {
      fs.mkdirSync(this.filePath, { recursive: true });
    }

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
      }).on('progress', (_, downloaded, total) => {
        this.total = total;
        this.downloaded = downloaded;
      })
    ).then(res => {
      this.audio = res;
      this.onBlobReadyCallback();
    });
  }

  id = '';
  filePath = '';
  url = '';
  list = [];
  total = 0;
  downloaded = 0;
  videoDetails = null;
  author = '';
  title = '';
  lengthSeconds = 0;

  audio = null /* Blob */;
  onBlobReadyCallback = () => {};
  onBlobReady(callback) {
    this.onBlobReadyCallback = callback;
  }
}
