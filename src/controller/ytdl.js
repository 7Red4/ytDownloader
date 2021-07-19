const ytdl = require('ytdl-core');

const getInfo = async (url) => {
  return await ytdl.getBasicInfo(url);
};

export { getInfo };
