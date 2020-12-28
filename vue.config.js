module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {},
      asar: {
        asarUnpack: ['node_modules/ffmpeg-static/*']
      }
    }
  }
};
