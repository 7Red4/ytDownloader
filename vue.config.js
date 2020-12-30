module.exports = {
  configureWebpack: {
    // Webpack configuration applied to web builds and the electron renderer process
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        extraFiles: [
          {
            from: 'node_modules/ffmpeg-static',
            to: './resources/node_modules/ffmpeg-static/'
          }
        ]
      }
    }
  }
};
