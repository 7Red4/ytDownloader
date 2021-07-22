const ytdl = require('ytdl-core');

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

export { getInfo };
