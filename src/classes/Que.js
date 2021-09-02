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
const isDevelopment = process.env.NODE_ENV !== 'production';

const ffmpeg = isDevelopment
  ? PATH.join(
      appRootDir,
      'src',
      'binaries',
      os.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    )
  : PATH.join(appRootDir, os.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

// TODO: find out how to pipe video & audio into ffmpeg
const youtubeDl = isDevelopment
  ? PATH.join(
      appRootDir,
      'src',
      'binaries',
      os.platform === 'win32' ? 'youtube-dl.exe' : 'youtube-dl'
    )
  : PATH.join(
      appRootDir,
      os.platform === 'win32' ? 'youtube-dl.exe' : 'youtube-dl'
    );

const getInfo = async (url) => {
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

    this.creatingSnapshot = false;
    this.tracker = new Tracker(id);
    this.proccesser = null;
    this.noVideo = false;
    this.noAudio = false;

    this.dlMethod = 'ytdl';
  }

  setReq(req) {
    this.req = req;
  }

  setEvent(event) {
    this.event = event;
  }

  updateQue(tracker) {
    const title = filenamify(tracker.title);
    this.tracker.setInfo(tracker);
    !!title && (this.title = title);
    !!tracker.path && (this.path = tracker.path);
    this.output = PATH.join(this.path, this.title);
    this.event.reply('download-processing', this.tracker);
  }

  async setBasicInfo({ req = this.req, event }) {
    this.tracker = new Tracker(this.id);
    this.setReq(req);
    this.setEvent(event);
    const { url, title, path, sourceReq } = req;
    const { noVideo, noAudio } = sourceReq || {};
    this.noVideo = noVideo;
    this.noAudio = noAudio;
    this.tracker.noVideo = noVideo;
    this.tracker.noAudio = noAudio;

    this.path = path;
    this.output = PATH.join(this.path, `${filenamify(title)}`);

    this.info = await getInfo(url);

    this.tracker.setInfo({ title, videoInfo: this.info, path });
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
      const bufferTimeout = 500;
      let bufferCounter = null;

      const bufferFunction = (fn) => {
        clearTimeout(bufferCounter);
        bufferCounter = null;

        bufferCounter = setTimeout(() => {
          fn && typeof fn === 'function' && fn();
        }, bufferTimeout);
      };

      this.video = ytdl(url).on('progress', async (_, downloaded, total) => {
        const isLive = (await getInfo(url)).videoDetails.isLive;

        this.tracker.video = { downloaded, total };
        this.event.reply('download-processing', this.tracker);

        console.log(Date(), isLive);
        if (!isLive) {
          bufferFunction(async () => {
            await this.snapShot();
            this.stopProcess();
            this.info.videoDetails.isLive = false;
          });
          return;
        }

        bufferFunction(() => {
          this.snapShot();
        });
      });

      this.video.pipe(
        fs.createWriteStream(PATH.join(this.path, `pending_${this.id}.ts`))
      );
      this.tracker.isRecording = true;
    } else {
      if (this.noAudio) {
        this.video = ytdl(url, {
          quality: quality.video,
          filter: 'videoonly',
          begin: 0
        }).on('progress', (_, downloaded, total) => {
          this.tracker.video = { downloaded, total };
          if (downloaded === total) {
            this.stopSlowEmit();
          }
        });

        this.video.pipe(fs.createWriteStream(`${this.output}.mp4`));
        this.slowEmit();
      } else if (this.noVideo) {
        this.audio = ytdl(url, {
          quality: quality.audio,
          filter: 'audioonly',
          begin: 0
        }).on('progress', (_, downloaded, total) => {
          this.tracker.audio = { downloaded, total };
          if (downloaded === total) {
            this.stopSlowEmit();
          }
        });

        this.audio.pipe(fs.createWriteStream(`${this.output}.mp3`));
        this.slowEmit();
      } else {
        this.audio = ytdl(url, {
          quality: quality.audio,
          begin: 0
        }).on('progress', (_, downloaded, total) => {
          this.tracker.audio = { downloaded, total };
        });

        this.video = ytdl(url, {
          quality: quality.video,
          begin: 0
        }).on('progress', (_, downloaded, total) => {
          this.tracker.video = { downloaded, total };
        });

        try {
          this.proccesser = this.ffmpegProcess([
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

          this.audio.pipe(this.proccesser.stdio[4]);
          this.video.pipe(this.proccesser.stdio[5]);
        } catch (error) {
          consola.error(error);
          this.event.reply('download-fail', error);
        }
      }
    }
  }

  stopProcess() {
    try {
      if (this.video) {
        this.video.destroy();
        this.video = null;
      }
      if (this.audio) {
        this.audio.destroy();
        this.audio = null;
      }
      // this.proccesser.kill();
      if (this.info.videoDetails.isLive) {
        this.convert();
      }
    } catch (error) {
      console.error(error);
    }
  }

  convert() {
    try {
      const proccesser = this.ffmpegProcess([
        'pipe:3',
        '-i',
        PATH.join(this.path, `pending_${this.id}.ts`),
        '-map',
        '0',
        '-c',
        'copy',
        `${this.output}.${this.format}`
      ]);

      let deleteTimmer = null;
      const pendingFile = PATH.join(this.path, `pending_${this.id}.ts`);
      const snapshot = PATH.join(this.path, `snapshot_${this.id}.jpg`);

      const cleanUp = () => {
        clearTimeout(deleteTimmer);
        deleteTimmer = null;

        if (this.creatingSnapshot) {
          deleteTimmer = setTimeout(() => {
            cleanUp();
          }, 700);
        } else {
          setTimeout(() => {
            fs.unlink(pendingFile, (err) => {
              if (err) consola.error(err);
            });
            fs.unlink(snapshot, (err) => {
              if (err) consola.error(err);
            });
          }, 700);
        }
      };

      proccesser.on('close', () => {
        try {
          cleanUp();
        } catch (error) {
          consola.error('delete error');
          consola.error(error);
        } finally {
          this.event.reply('download-complete', this.tracker);
        }
      });
    } catch (error) {
      consola.error(error);
    }
  }

  slowEmit() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.timer = setInterval(() => {
      this.event.reply('download-processing', this.tracker);
    }, 200);
  }

  stopSlowEmit() {
    clearInterval(this.timer);
    this.timer = null;
    this.event.reply('download-processing', this.tracker);
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

    ffmpegProcess.on('close', (e) => {
      this.tracker.isRunning = false;
      this.tracker.isRecording = false;

      this.event.reply('download-complete', this.tracker);
    });

    ffmpegProcess.on('error', (e) => {
      this.tracker.error = true;
      this.event.reply('download-fail', error);
      this.event.reply('download-processing', this.tracker);
    });

    ffmpegProcess.stdio[3].on('data', (chunk) => {
      const lines = chunk.toString().trim().split('\n');

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

  snapShot() {
    return new Promise((resolve, reject) => {
      this.creatingSnapshot = true;
      const pendingFile = PATH.join(this.path, `pending_${this.id}.ts`);
      const snapshot = PATH.join(this.path, `snapshot_${this.id}.jpg`);
      if (fs.existsSync(snapshot)) {
        fs.unlinkSync(snapshot);
      }

      const snapshotProcess = cp.spawn(ffmpeg, [
        '-loglevel',
        '8',
        '-hide_banner',
        '-progress',
        ,
        '-sseof',
        '-3',
        '-i',
        pendingFile,
        '-update',
        '1',
        '-q:v',
        '1',
        snapshot
      ]);

      snapshotProcess.on('close', (e) => {
        this.creatingSnapshot = false;
        console.log('close');
        this.event.reply('snapshot-update', this.tracker);
        resolve();
      });

      snapshotProcess.on('error', (e) => {
        reject(e);
      });
    });
  }
}
