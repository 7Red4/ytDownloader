module.exports = {
  transpileDependencies: ['vuetify'],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        extraFiles: [
          {
            from: 'src/binaries',
            to: './resources/'
          }
        ]
      }
    }
  }
};
