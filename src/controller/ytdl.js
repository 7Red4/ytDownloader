const ytdl = require('ytdl-core');
// Buildin with nodejs
const cp = require('child_process');
// External modules
const ffmpeg = require('ffmpeg-static-electron');

const getInfo = async url => {
  return await ytdl.getBasicInfo(url);
};

const start = async req => {
  // Global constants
  const { url, title, path, quality } = req;
  console.log(`${path}/${title}.mp4`);

  const tracker = {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: '0x', fps: 0 }
  };

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
  const progressbarHandle = null;
  const progressbarInterval = 1000;
  const showProgress = () => {
    //
  };

  try {
    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(
      ffmpeg.path,
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
        `${path}/${title}.mp4`
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
      console.log('done');
      // Cleanup
      clearInterval(progressbarHandle);
    });

    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    ffmpegProcess.stdio[3].on('data', chunk => {
      // // Start the progress bar
      // if (!progressbarHandle) {
      //   progressbarHandle = setInterval(showProgress, progressbarInterval);
      // }
      // // Parse the param=value list returned by ffmpeg
      // const lines = chunk
      //   .toString()
      //   .trim()
      //   .split('\n');
      // const args = {};
      // for (const l of lines) {
      //   const [key, value] = l.split('=');
      //   args[key.trim()] = value.trim();
      // }
      // tracker.merged = args;
    });

    audio.pipe(ffmpegProcess.stdio[4]);
    video.pipe(ffmpegProcess.stdio[5]);
  } catch (error) {
    console.error(error);
  }
};

export { getInfo, start };
