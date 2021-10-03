module.exports = {
  transpileDependencies: ['vuetify'],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        win: {
          icon: './icons/icon.png'
        },
        extraFiles: [
          {
            from: 'icons/icon.png',
            to: './resources/icons/icon.png'
          },
          {
            from: 'src/binaries',
            to: './resources/'
          }
        ]
      }
    }
  }
};
