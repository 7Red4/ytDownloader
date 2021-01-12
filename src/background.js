'use strict';

import fs from 'fs';
import https from 'https';

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { getInfo, start, record } from '@/controller/ytdl.js';
import consola from 'consola';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: isDevelopment ? 1240 : 810,
    height: 960,
    titleBarStyle: 'hidden',
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      consola.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

// ipc events

ipcMain.on('get-yt-info', async (event, url) => {
  try {
    const info = await getInfo(url);
    event.reply('get-yt-info-reply', info);
  } catch (error) {
    consola.error(error);
  }
});

ipcMain.on('pick-path', async event => {
  const path = await dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory', 'multiSelections']
  });

  event.reply('pick-path-reply', path);
});

ipcMain.on('download', async (event, req) => {
  try {
    await start(req, event);
  } catch (error) {
    event.reply('download-fail');
    consola.error(error);
  }
});

ipcMain.on('exit', async (event, req) => {
  try {
    await record.stop();
  } catch (error) {
    event.reply('stoped-error');
    consola.error(error);
  }
});

ipcMain.on('pick-thumbnail-path', async (event, title) => {
  try {
    const path = dialog.showSaveDialogSync({
      defaultPath: title,
      filters: [{ name: 'Images', extensions: ['jpg', 'png'] }]
    });
    event.reply('pick-thumbnail-path-reply', path);
  } catch (error) {
    consola.error(error);
  }
});

ipcMain.on('download-thumbnail', async (event, { url, path }) => {
  try {
    const file = fs.createWriteStream(path);
    https.get(url, response => {
      response.pipe(file);
      response.on('close', () => {
        event.reply('download-thumbnail-complete');
      });
    });
  } catch (error) {
    event.reply('download-thumbnail-fail', error);
    consola.error(error);
  }
});
