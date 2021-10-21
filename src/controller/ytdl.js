import cp from 'child_process';
import os from 'os';
import PATH from 'path';
import ytdl from 'ytdl-core';

const appRootDir = require('app-root-dir').get();
const isDevelopment = process.env.NODE_ENV !== 'production';
const ytDlp = isDevelopment
  ? PATH.join(
    appRootDir,
    'src',
    'binaries',
    os.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  )
  : PATH.join(
    appRootDir,
    os.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
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
      const ytDlpProcess = cp.spawn(ytDlp, [url, '-F']);

      let scriptOutput = '';

      ytDlpProcess.stdout.on('data', (data) => {
        data = data.toString();
        scriptOutput += data;
      });

      ytDlpProcess.on('close', () => {
        const formats = scriptOutput;
        resolve(formats);
      });
    } catch (err) {
      reject(err);
    }
  });
};

export { getInfo, getFormat };
