const ytdl = require('ytdl-core');
// Buildin with nodejs
import cp from 'child_process';
import os from 'os';
import PATH from 'path';
import consola from 'consola';
import fs from 'fs';

// External modules
import filenamify from 'filenamify';

import Tracker from './Tracker';

const appRootDir = require('app-root-dir').get();

const ffmpeg = PATH.join(
  appRootDir,
  'node_modules',
  'ffmpeg-static',
  os.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
);

const getInfo = async url => {
  return await ytdl.getBasicInfo(url);
};

export default class Que {
  constructor(req) {
    const id = Date.now();

    this.id = id;
    this.video = null;
    this.audio = null;
    this.info = null;
    this.path = '';
    this.output = '';
    this.format = 'mp4';
    this.event = null;
    this.timer = null;
    this.req = req || null;

    this.tracker = new Tracker(id);
  }

  async startProcess({ req = this.req, event }) {
    // reset tracker
    this.tracker = new Tracker(this.id);
    this.req = req;
    this.event = event;

    const { url, title, path, quality } = req;
    this.output = PATH.join(path, `${filenamify(title)}`);

    if (fs.existsSync(this.output)) {
      this.event.reply('download-fail', '影片已存在或檔名重複');
      return;
    }

    const videoInfo = await getInfo(url);

    this.tracker.setInfo(videoInfo);

    if (videoInfo.videoDetails.isLive) {
      this.video = ytdl(url).on('progress', (_, downloaded, total) => {
        this.event.reply('download-processing', this.tracker);
      });

      this.video.pipe(
        fs.createWriteStream(PATH.join(this.path, 'pending_v.ts'))
      );
    } else {
      this.audio = ytdl(url, {
        quality: quality.audio
      }).on('progress', (_, downloaded, total) => {
        this.tracker.audio = { downloaded, total };
      });

      this.video = ytdl(url, {
        quality: quality.video
      }).on('progress', (_, downloaded, total) => {
        this.tracker.video = { downloaded, total };
      });

      try {
        const ffmpegProcess = this.ffmpegProcess([
          'pipe:3',
          '-i',
          'pipe:4',
          '-i',
          'pipe:5',
          '-map',
          '0:a',
          '-map',
          '1:v',
          '-c:v',
          'copy',
          `${this.output}.${this.format}`
        ]);

        this.audio.pipe(ffmpegProcess.stdio[4]);
        this.video.pipe(ffmpegProcess.stdio[5]);
      } catch (error) {
        consola.error(error);
        this.event.reply('download-fail', error);
      }
    }
  }

  stopProcess() {
    if (this.video) this.video.destroy();
    this.convert();
  }

  convert() {
    try {
      const ffmpegProcess = this.ffmpegProcess([
        'pipe:3',
        '-i',
        PATH.join(this.path, 'pending_v.ts'),
        '-map',
        '0',
        '-c',
        'copy',
        `${this.output}.${this.format}`
      ]);

      ffmpegProcess.on('close', () => {
        const pendingFile = PATH.join(this.path, 'pending_v.ts');
        try {
          fs.unlinkSync(pendingFile);
        } catch (error) {
          consola.error('delete error');
          consola.error(error);
        }
        this.event.reply('download-complete');
      });
    } catch (error) {
      consola.error(error);
    }
  }

  ffmpegProcess(args) {
    const ffmpegProcess = cp.spawn(
      ffmpeg,
      ['-loglevel', '8', '-hide_banner', '-progress', ...args],
      {
        windowsHide: true,
        stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe']
      }
    );

    ffmpegProcess.on('close', () => {
      this.event.reply('download-complete');
      this.tracker.isRunning = false;
    });

    ffmpegProcess.on('error', () => {
      this.event.reply('download-fail', error);
      this.tracker.error = true;
    });

    ffmpegProcess.stdio[3].on('data', chunk => {
      const lines = chunk
        .toString()
        .trim()
        .split('\n');

      const args = {};

      for (const l of lines) {
        const [key, value] = l.split('=');
        args[key.trim()] = value.trim();
      }
      this.tracker.merged = args;
      this.event.reply('download-processing', this.tracker);
    });

    return ffmpegProcess;
  }
}
