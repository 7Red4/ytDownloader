import ytdl from 'ytdl-core';
import https from 'https';
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

const getInfo = async (url, options = {}) => {
  return await ytdl.getBasicInfo(url, options);
};

export default class Que {
  constructor(req) {
    const id = Date.now();

    this.id = id;
    this.info = null;
    this.path = '';
    this.output = '';
    this.format = 'mp4';
    this.event = null;
    this.timer = null;
    this.req = req || null;
    this.cookie = '';

    this.creatingSnapshot = false;
    this.tracker = new Tracker(id);
    this.noVideo = false;
    this.noAudio = false;
    this.audioDone = false;
    this.videoDone = false;
    this.videoDestoryed = false;
    this.audioDestoryed = false;

    this.isVideoSourceFailed = false;

    this.isMerging = false;
    this.isMerged = false;

    this.dlMethod = 'ytdl';

    this.defaultYtdlOption = {
      begin: 0,
      requestOptions: {
        headers: {
          cookie: req.cookie || ''
        }
      }
    };
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
    this.req = req;
    this.event = event;
    const { url, title, path, sourceReq, cookie, dlMethod } = req;
    const { noVideo, noAudio } = sourceReq || {};
    this.dlMethod = dlMethod;
    this.noVideo = noVideo;
    this.noAudio = noAudio;
    this.tracker.noVideo = noVideo;
    this.tracker.noAudio = noAudio;

    if (cookie) {
      this.defaultYtdlOption = {
        ...this.defaultYtdlOption,
        requestOptions: {
          headers: {
            cookie: req.cookie
          }
        }
      };
    }

    this.path = path;
    this.output = PATH.join(this.path, `${filenamify(title)}`);

    this.info = await getInfo(url, this.defaultYtdlOption);

    const thumbnail = this.info.videoDetails.thumbnails.length
      ? this.info.videoDetails.thumbnails[
          this.info.videoDetails.thumbnails.length - 1
        ].url
      : '';
    const isLiveRecord =
      this.info.videoDetails.liveBroadcastDetails &&
      this.info.videoDetails.liveBroadcastDetails.isLiveNow;

    this.tracker.setInfo({
      title,
      thumbnail,
      req,
      isLive: isLiveRecord,
      path,
      dlMethod
    });
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
    this.video = null;
    this.audio = null;
    this.info = null;
    this.event = null;
    await this.setBasicInfo({ req, event });
    this.fileCheckAndRename(`${this.output}.${this.format}`);

    const workdir = PATH.join(this.path, '.ytdlWorkingFiles');
    if (!fs.existsSync(workdir)) {
      fs.mkdir(workdir, (err) => {
        if (err) console.error(err);
      });
    }

    const { url, quality } = req;

    this.audioDone = false;
    this.videoDone = false;
    this.videoDestoryed = false;
    this.audioDestoryed = false;
    this.isMerged = false;

    if (this.noAudio) {
      const video = ytdl(url, {
        ...this.defaultYtdlOption,
        quality: quality.video,
        filter: 'videoonly'
      }).on('progress', (_, downloaded, total) => {
        this.tracker.video = { downloaded, total };
        if (downloaded === total) {
          this.stopSlowEmit();
        }
      });

      video.pipe(fs.createWriteStream(`${this.output}.mp4`));
      this.slowEmit();
    } else if (this.noVideo) {
      const audio = ytdl(url, {
        ...this.defaultYtdlOption,
        quality: quality.audio,
        filter: 'audioonly'
      }).on('progress', (_, downloaded, total) => {
        this.tracker.audio = { downloaded, total };
        if (downloaded === total) {
          this.stopSlowEmit();
        }
      });

      audio.pipe(fs.createWriteStream(`${this.output}.mp3`));
      this.slowEmit();
    } else {
      if (this.dlMethod === 'ytdl') {
        this.ytdlProcess(url, quality);
      } else if (this.dlMethod === 'youtube-dl') {
        this.youtubeDlProcess(url, quality);
      }
    }
  }

  ytdlProcess(url, quality) {
    const bufferTimeout = 500;
    let bufferCounter = null;

    const bufferFunction = (fn) => {
      clearTimeout(bufferCounter);
      bufferCounter = null;

      bufferCounter = setTimeout(() => {
        fn && typeof fn === 'function' && fn();
      }, bufferTimeout);
    };

    const isLiveRecord =
      this.info.videoDetails.liveBroadcastDetails &&
      this.info.videoDetails.liveBroadcastDetails.isLiveNow;

    const checkLiveStatus = async () => {
      const liveBroadcastDetails = (await getInfo(url)).videoDetails
        .liveBroadcastDetails;
      const isLive = liveBroadcastDetails && liveBroadcastDetails.isLiveNow;
      consola.info(`isLive: ${isLive}`);
      if (isLiveRecord && !isLive) {
        await this.snapShot(isLiveRecord);
        this.stopProcess();
        this.info.videoDetails.isLive = false;
      }
    };

    const onAudioDone = () => {
      this.audioDone = true;
      if (this.audioDone && this.videoDone) {
        this.stopProcess();
      }
    };

    const onVideoDone = () => {
      this.videoDone = true;
      if (this.audioDone && this.videoDone) {
        this.stopProcess();
      }
    };

    const audioOption = {
      ...this.defaultYtdlOption
    };
    if (!isLiveRecord) {
      audioOption.quality = quality.audio;
      audioOption.filter = 'audioonly';
    }
    const audio = ytdl(url, audioOption)
      .once('response', () => {
        // starttime = Date.now();
      })
      .on('progress', (_, downloaded, total) => {
        this.tracker.audio = { downloaded, total };
        consola.info(
          `prcess: 'audio', downloaded: ${downloaded}, total: ${total}`
        );
        bufferFunction(() => {
          this.snapShot(isLiveRecord);
        });

        if ((!isLiveRecord && downloaded === total) || this.audioDestoryed) {
          audio.destroy();
          onAudioDone();
        }
      })
      .on('error', (e) => {
        consola.error(e);
        this.event.reply('start-fail', e);
        this.stopProcess();
      })
      .on('end', (e) => {
        consola.error('audio end');
        consola.warn(e);
        onAudioDone();
      });

    const video = ytdl(url, {
      ...this.defaultYtdlOption,
      quality: quality.video || 'highestvideo',
      filter: 'videoonly'
    })
      .once('response', (e) => {
        // consola.info(e);
      })
      .on('progress', (_, downloaded, total) => {
        this.tracker.video = { downloaded, total };
        if (isNaN(total)) {
          this.isVideoSourceFailed = true;
          this.tracker.isVideoSourceFailed = true;
        }
        consola.info(
          `prcess: 'video', downloaded: ${downloaded}, total: ${total}`
        );

        if (isLiveRecord) {
          checkLiveStatus();
        }
        if ((!isLiveRecord && downloaded === total) || this.videoDestoryed) {
          video.destroy();
          onVideoDone();
        }
      })
      .on('end', (e) => {
        consola.error('video end');
        consola.warn(e);
        onVideoDone();
      });

    // this.pipeVandA(video, audio, true);
    const pendingVideo = PATH.join(
      this.path,
      '.ytdlWorkingFiles',
      `pending_${this.id}_v.ts`
    );
    const pendingAudio = PATH.join(
      this.path,
      '.ytdlWorkingFiles',
      `pending_${this.id}_a.ts`
    );

    video.pipe(fs.createWriteStream(pendingVideo));
    audio.pipe(fs.createWriteStream(pendingAudio));

    this.slowEmit();
  }

  async youtubeDlProcess(url, quality) {
    this.tracker.isRunning = true;

    this.tracker.isComplete = false;
    this.event.reply('download-processing', this.tracker);

    const getVideoM3u8 = () =>
      new Promise((resolve, reject) => {
        try {
          const getm3u8 = cp.spawn(youtubeDl, ['-f', quality.video, '-g', url]);
          let m3u8Url = '';
          getm3u8.stdout.on('data', (data) => {
            data = data.toString();
            m3u8Url += data;
          });

          getm3u8.on('close', () => {
            resolve(m3u8Url.replace(/\s\s+/g, ''));
          });
        } catch (err) {
          consola.error(err);
          reject(err);
        }
      });

    const getAudioM3u8 = () =>
      new Promise((resolve, reject) => {
        try {
          const getm3u8 = cp.spawn(youtubeDl, ['-f', quality.audio, '-g', url]);
          let m3u8Url = '';
          getm3u8.stdout.on('data', (data) => {
            data = data.toString();
            m3u8Url += data;
          });

          getm3u8.on('close', () => {
            resolve(m3u8Url.replace(/\s\s+/g, ''));
          });
        } catch (err) {
          consola.error(err);
          reject(err);
        }
      });

    try {
      let videoM3u8Url = await getVideoM3u8();
      let audioM3u8Url = await getAudioM3u8();

      this.youtubeDlPipeVandA(videoM3u8Url, audioM3u8Url);
    } catch (e) {
      this.event.reply('start-fail', e);
      consola.error(e);
    }
  }

  youtubeDlPipeVandA(video, audio) {
    const ffmpegProcess = cp.spawn(
      ffmpeg,
      [
        '-loglevel',
        '8',
        '-hide_banner',
        '-progress',
        'pipe:3',
        '-i',
        audio,
        '-i',
        video,
        '-map',
        '0:a?',
        '-map',
        '1:v',
        '-c:v',
        'copy',
        `${this.output}.${this.format}`
      ],
      {
        windowsHide: true,
        stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe']
      }
    );

    ffmpegProcess.stdio[3].on('data', (chunk) => {
      if (this.videoDestoryed || this.audioDestoryed) {
        ffmpegProcess.kill('SIGINT');
      }
      const lines = chunk.toString().trim().split('\n');

      const args = {};

      for (const l of lines) {
        const [key, value] = l.split('=');
        args[key.trim()] = value.trim();
      }

      this.tracker.merged = args;
      this.event.reply('download-processing', this.tracker);
    });

    ffmpegProcess.on('close', (e) => {
      this.tracker.isRunning = false;
      this.tracker.isRecording = false;

      this.isMerging = false;
      this.tracker.isMerging = false;
      this.isMerged = true;

      try {
        this.cleanUpPendings();
      } catch (error) {
        consola.error('delete error');
        consola.error(error);
      } finally {
        this.tracker.isComplete = true;
        this.event.reply('download-complete', this.tracker);
      }
    });

    ffmpegProcess.on('error', (e) => {
      consola.error(e);
    });
  }

  merge() {
    if (this.isMerging || this.isMerged) return;
    this.isMerging = true;
    this.tracker.isMerging = true;

    const pendingVideo = PATH.join(
      this.path,
      '.ytdlWorkingFiles',
      `pending_${this.id}_v.ts`
    );
    const pendingAudio = PATH.join(
      this.path,
      '.ytdlWorkingFiles',
      `pending_${this.id}_a.ts`
    );

    const args = this.isVideoSourceFailed
      ? ['-i', pendingAudio, `${this.output}.${this.format}`]
      : [
          '-i',
          pendingAudio,
          '-i',
          pendingVideo,
          '-map',
          '0:a?',
          '-map',
          '1:v',
          '-c:v',
          'copy',
          `${this.output}.${this.format}`
        ];

    const mergeProcess = cp.spawn(
      ffmpeg,
      ['-loglevel', '8', '-hide_banner', '-progress', 'pipe:3', ...args],
      {
        windowsHide: true,
        stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe']
      }
    );

    mergeProcess.stdio[3].on('data', (chunk) => {
      const lines = chunk.toString().trim().split('\n');

      const args = {};

      for (const l of lines) {
        const [key, value] = l.split('=');
        args[key.trim()] = value.trim();
      }

      this.tracker.merged = args;
      this.event.reply('download-processing', this.tracker);
      consola.info(lines.join(', '));
    });

    mergeProcess.on('close', (e) => {
      this.tracker.isRunning = false;
      this.tracker.isRecording = false;

      this.isMerging = false;
      this.tracker.isMerging = false;
      this.tracker.isComplete = true;
      this.isMerged = true;

      this.stopSlowEmit();

      try {
        this.cleanUpPendings();
      } catch (error) {
        consola.error('delete error');
        consola.error(error);
      } finally {
        this.event.reply('download-complete', this.tracker);
      }
    });

    mergeProcess.on('error', (e) => {
      console.error(e);
    });
  }

  stopProcess() {
    this.videoDestoryed = true;
    this.audioDestoryed = true;
    if (this.dlMethod === 'ytdl') {
      this.merge();
    }
  }

  cleanUpPendings() {
    let deleteTimmer = null;

    const pendingVideo = PATH.join(
      this.path,
      '.ytdlWorkingFiles',
      `pending_${this.id}_v.ts`
    );
    const pendingAudio = PATH.join(
      this.path,
      '.ytdlWorkingFiles',
      `pending_${this.id}_a.ts`
    );
    const snapshot = PATH.join(
      this.path,
      '.ytdlWorkingFiles',
      `snapshot_${this.id}.jpg`
    );

    if (this.creatingSnapshot) {
      deleteTimmer = setTimeout(() => {
        this.cleanUpPendings();
      }, 700);
    } else {
      clearTimeout(deleteTimmer);
      deleteTimmer = null;
      fs.unlink(snapshot, (err) => {
        if (err) consola.info(err);
      });
      fs.unlink(pendingVideo, (err) => {
        if (err) consola.info(err);
      });
      fs.unlink(pendingAudio, (err) => {
        if (err) consola.info(err);
      });
    }
  }

  slowEmit() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.timer = setInterval(() => {
      this.tracker.isRunning = true;
      this.event.reply('download-processing', this.tracker);
    }, 1000);
  }

  stopSlowEmit() {
    clearInterval(this.timer);
    this.timer = null;
    this.tracker.isRunning = false;
    this.event.reply('download-processing', this.tracker);
  }

  snapShot(isLiveRecord) {
    return new Promise((resolve, reject) => {
      this.creatingSnapshot = true;
      const pendingVideo = PATH.join(
        this.path,
        '.ytdlWorkingFiles',
        `pending_${this.id}_v.ts`
      );
      const pendingAudio = PATH.join(
        this.path,
        '.ytdlWorkingFiles',
        `pending_${this.id}_a.ts`
      );
      const snapshot = PATH.join(
        this.path,
        '.ytdlWorkingFiles',
        `snapshot_${this.id}.jpg`
      );
      if (fs.existsSync(snapshot)) {
        fs.unlinkSync(snapshot);
      }

      const snapshotProcess = cp.spawn(ffmpeg, [
        '-sseof',
        '-3',
        '-i',
        isLiveRecord ? pendingAudio : pendingVideo,
        '-update',
        '1',
        '-q:v',
        '1',
        snapshot
      ]);

      snapshotProcess.on('close', (e) => {
        this.creatingSnapshot = false;
        this.event.reply('snapshot-update', this.tracker);
        resolve();
      });

      snapshotProcess.on('error', (e) => {
        reject(e);
      });
    });
  }
}
