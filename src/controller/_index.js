const fs = require('fs');
const ytdl = require('ytdl-core');
const filenamify = require('filenamify');
const consola = require('consola');
const _colors = require('colors');

const cliProgress = require('cli-progress');
const { log } = require('console');

const url = 'https://www.youtube.com/watch?v=1-7v7Yyme7Y';

const start = async () => {
  try {
    const { player_response, formats } = await ytdl.getBasicInfo(url);
    const { videoDetails } = player_response;
    const dl = ytdl(url);

    consola.info(`is Live: ${Boolean(videoDetails.isLive)}`);
    consola.info(`start downloading: ${videoDetails.title}`);
    log('\n\n');

    consola.info(formats);
    ytdl.chooseFormat(formats, { quality: '134' });

    dl.pipe(fs.createWriteStream(`${filenamify(videoDetails.title)}.mp4`));

    const bar = new cliProgress.SingleBar({
      format:
        'CLI Progress |' +
        _colors.cyan('{bar}') +
        '| {percentage}% || {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    bar.start(0, 0);

    dl.on('progress', (length, downloaded, total) => {
      bar.setTotal(total);
      bar.update(downloaded);
    });
  } catch (error) {
    dl.destroy();
    consola.error(error);
  }
};

start();
