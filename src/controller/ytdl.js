const ytdl = require('ytdl-core');
// Buildin with nodejs
import cp from 'child_process';
import os from 'os';
import PATH from 'path';
import consola from 'consola';
import fs from 'fs';

// External modules
import filenamify from 'filenamify';

const appRootDir = require('app-root-dir').get();

const ffmpeg = PATH.join(
  appRootDir,
  'node_modules',
  'ffmpeg-static',
  os.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
);

const tracker = {
  start: Date.now(),
  audio: { downloaded: 0, total: Infinity },
  video: { downloaded: 0, total: Infinity },
  merged: { frame: 0, speed: '0x', fps: 0 }
};

const getInfo = async url => {
  return await ytdl.getBasicInfo(url);
};

const record = {
  video: null,
  path: '',
  output: '',
  event: null,
  start(req, event) {
    tracker.start = Date.now();
    tracker.audio = { downloaded: 0, total: Infinity };
    tracker.video = { downloaded: 0, total: Infinity };
    tracker.merged = { frame: 0, speed: '0x', fps: 0 };

    const { url, title, path, quality, format = 'mp4' } = req;
    this.path = path;
    this.output = PATH.join(path, `${filenamify(title)}`);
    this.event = event;
    this.format = format;

    this.video = ytdl(url).on('progress', (_, downloaded, total) => {
      this.event.reply('download-processing', tracker);
    });

    this.video.pipe(fs.createWriteStream(`${this.path}/pending_v.ts`));
  },
  stop() {
    if (this.video) this.video.destroy();
    this.convert();
  },
  convert() {
    try {
      // Start the ffmpeg child process

      const ffmpegProcess = cp.spawn(
        ffmpeg,
        [
          // Remove ffmpeg's console spamming
          '-loglevel',
          '8',
          '-hide_banner',
          // Redirect/Enable progress messages
          '-progress',
          'pipe:3',
          // Set inputs
          '-i',
          PATH.join(this.path, 'pending_v.ts'),
          '-map',
          '0',
          '-c',
          'copy',
          `${this.output}.${this.format}`
        ],
        {
          windowsHide: true,
          stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe']
        }
      );

      // Prepare the progress bar
      let progressbarHandle = null;
      const progressbarInterval = 1000;
      const showProgress = () => {
        this.event.reply('download-processing', tracker);
      };

      ffmpegProcess.on('close', () => {
        const pendingFile = PATH.join(this.path, 'pending_v.ts');
        setTimeout(() => {
          try {
            fs.unlinkSync(pendingFile);
          } catch (error) {
            consola.error('delete error');
            consola.error(error);
          }
          console.log('CLOSEEEE');
          this.event.reply('download-complete');
          // Cleanup
          clearInterval(progressbarHandle);
        }, 2500);
      });

      // Link streams
      // FFmpeg creates the transformer streams and we just have to insert / read data
      ffmpegProcess.stdio[3].on('data', chunk => {
        // // Start the progress bar
        if (!progressbarHandle) {
          progressbarHandle = setInterval(showProgress, progressbarInterval);
        }
        // Parse the param=value list returned by ffmpeg
        const lines = chunk
          .toString()
          .trim()
          .split('\n');
        const args = {};
        for (const l of lines) {
          const [key, value] = l.split('=');
          args[key.trim()] = value.trim();
        }
        tracker.merged = args;
      });
    } catch (error) {
      consola.error(error);
    }
  }
};

const start = async (req, event) => {
  // Global constants
  const { url, title, path, quality, format = 'mp4' } = req;
  const output = PATH.join(path, `${filenamify(title)}.${format}`);

  if (fs.existsSync(output)) {
    event.reply('download-fail', '影片已存在或檔名重複');
    return;
  }

  const videoInfo = await getInfo(url);

  if (videoInfo.videoDetails.isLive) {
    record.start(req, event);
  } else {
    // Get audio and video streams
    const audio = ytdl(url, {
      quality: quality.audio
    }).on('progress', (_, downloaded, total) => {
      tracker.audio = { downloaded, total };
    });

    const video = ytdl(url, {
      quality: quality.video
    }).on('progress', (_, downloaded, total) => {
      tracker.video = { downloaded, total };
    });

    // Prepare the progress bar
    let progressbarHandle = null;
    const progressbarInterval = 1000;
    const showProgress = () => {
      event.reply('download-processing', tracker);
    };

    try {
      // Start the ffmpeg child process
      const ffmpegProcess = cp.spawn(
        ffmpeg,
        [
          // Remove ffmpeg's console spamming
          '-loglevel',
          '8',
          '-hide_banner',
          // Redirect/Enable progress messages
          '-progress',
          'pipe:3',
          // Set inputs
          '-i',
          'pipe:4',
          '-i',
          'pipe:5',
          // Map audio & video from streams
          '-map',
          '0:a',
          '-map',
          '1:v',
          // Keep encoding
          '-c:v',
          'copy',
          // Define output file
          output
        ],
        {
          windowsHide: true,
          stdio: [
            /* Standard: stdin, stdout, stderr */
            'inherit',
            'inherit',
            'inherit',
            /* Custom: pipe:3, pipe:4, pipe:5 */
            'pipe',
            'pipe',
            'pipe'
          ]
        }
      );

      ffmpegProcess.on('close', () => {
        event.reply('download-complete');
        // Cleanup
        clearInterval(progressbarHandle);
      });

      ffmpegProcess.on('error', () => {
        event.reply('download-fail', error);
      });

      // Link streams
      // FFmpeg creates the transformer streams and we just have to insert / read data
      ffmpegProcess.stdio[3].on('data', chunk => {
        // // Start the progress bar
        if (!progressbarHandle) {
          progressbarHandle = setInterval(showProgress, progressbarInterval);
        }
        // Parse the param=value list returned by ffmpeg
        const lines = chunk
          .toString()
          .trim()
          .split('\n');
        const args = {};
        for (const l of lines) {
          const [key, value] = l.split('=');
          args[key.trim()] = value.trim();
        }
        tracker.merged = args;
      });

      audio.pipe(ffmpegProcess.stdio[4]);
      video.pipe(ffmpegProcess.stdio[5]);
    } catch (error) {
      consola.error(error);
      event.reply('download-fail', error);
    }
  }
};

export { getInfo, start, record };
