import cp from 'child_process';
import os from 'os';
import PATH from 'path';
import ytdl from 'ytdl-core';

const appRootDir = require('app-root-dir').get();
const isDevelopment = process.env.NODE_ENV !== 'production';
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
  let result = null;
  let error = null;
  try {
    result = await ytdl.getBasicInfo(url);
  } catch (err) {
    console.error(err);
    error = err;
  }

  return { result, error };
};

const getFormat = (url) => {
  return new Promise((resolve, reject) => {
    try {
      const youtubeDlProcess = cp.spawn(youtubeDl, [url, '-F']);

      let scriptOutput = '';

      youtubeDlProcess.stdout.on('data', (data) => {
        data = data.toString();
        scriptOutput += data;
      });

      youtubeDlProcess.on('close', () => {
        const formats = scriptOutput
          .split('format code  extension  resolution note')[1]
          .split('\n');

        resolve(formats);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export { getInfo, getFormat };
