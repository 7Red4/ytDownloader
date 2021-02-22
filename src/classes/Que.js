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

  setReq(req) {
    this.req = req;
  }

  setEvent(event) {
    this.event = event;
  }

  async setBasicInfo({ req = this.req, event }) {
    this.tracker = new Tracker(this.id);
    this.setReq(req);
    this.setEvent(event);
    const { url, title, path } = req;
    this.path = path;
    this.output = PATH.join(this.path, `${filenamify(title)}`);

    this.info = await getInfo(url);

    this.tracker.setInfo({ title, videoInfo: this.info });
  }

  fileCheckAndRename(filePath, count = 1) {
    if (fs.existsSync(filePath)) {
      this.output = PATH.join(
        this.path,
        `${filenamify(this.req.title)}(${count})`
      );
      this.fileCheckAndRename(`${this.output}.${this.format}`, count + 1);
    }
  }

  async startProcess({ req = this.req, event }) {
    // reset tracker
    if (!this.event) await this.setBasicInfo({ req, event });
    this.fileCheckAndRename(`${this.output}.${this.format}`);

    const { url, quality } = req;

    if (this.info.videoDetails.isLive) {
      this.video = ytdl(url).on('progress', (_, downloaded, total) => {
        this.tracker.video = { downloaded, total };
        this.event.reply('download-processing', this.tracker);
      });

      this.video.pipe(
        fs.createWriteStream(PATH.join(this.path, `pending_${this.id}.ts`))
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
          '0:a?',
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
    this.ffmpegProcess.kill('SIGINT');
    if (this.video) this.video.destroy();
    if (this.audio) this.audio.destroy();
    if (this.info.videoDetails.isLive) {
      this.convert();
    }
  }

  convert() {
    try {
      const ffmpegProcess = this.ffmpegProcess([
        'pipe:3',
        '-i',
        PATH.join(this.path, `pending_${this.id}.ts`),
        '-map',
        '0',
        '-c',
        'copy',
        `${this.output}.${this.format}`
      ]);

      ffmpegProcess.on('close', () => {
        const pendingFile = PATH.join(this.path, `pending_${this.id}.ts`);
        try {
          fs.unlinkSync(pendingFile);
        } catch (error) {
          consola.error('delete error');
          consola.error(error);
        }
        this.event.reply('download-complete', this.tracker);
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
      this.tracker.isRunning = false;
      this.event.reply('download-complete', this.tracker);
    });

    ffmpegProcess.on('error', () => {
      this.tracker.error = true;
      this.event.reply('download-fail', error);
      this.event.reply('download-processing', this.tracker);
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
      this.tracker.isRunning = true;
      this.event.reply('download-processing', this.tracker);
    });

    return ffmpegProcess;
  }
}
