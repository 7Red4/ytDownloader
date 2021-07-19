import fs from 'fs';
import https from 'https';
import os from 'os';

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { getInfo } from './controller/ytdl.js';
import Que from './classes/Que.js';
import consola from 'consola';

const isDevelopment = process.env.NODE_ENV !== 'production';
const queMap = new Map();

let win = {};

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

async function createWindow() {
  win = new BrowserWindow({
    frame: false,
    width: isDevelopment ? 1240 : 810,
    height: 960,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    win.loadURL('app://./index.html');
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      consola.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
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
ipcMain.on('get-platform', (event) => {
  const platform = os.platform();
  event.reply('get-platform-reply', platform);
});

ipcMain.on('minimize-window', () => win.minimize && win.minimize());
ipcMain.on('toggle-window', () =>
  win.isMaximized() ? win.unmaximize() : win.maximize()
);
ipcMain.on('close-window', () => {
  process.exit(0);
});

ipcMain.on('get-yt-info', async (event, url) => {
  try {
    const info = await getInfo(url);
    event.reply('get-yt-info-reply', info);
  } catch (error) {
    consola.error(error);
  }
});

ipcMain.on('pick-path', async (event) => {
  const path = await dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory', 'multiSelections']
  });

  event.reply('pick-path-reply', path);
});

ipcMain.on('start-que', async (event, req) => {
  const que = new Que();
  try {
    await que.startProcess({ req, event });
    queMap.set(que.id, que);
    event.reply('set-que-id-reply', que.tracker);
  } catch (error) {
    event.reply('start-fail', que.id);
    consola.error(error);
  }
});

ipcMain.on('add-que', async (event, req) => {
  const que = new Que();
  try {
    await que.setBasicInfo({ req, event });
    queMap.set(que.id, que);
    event.reply('set-que-id-reply', que.tracker);
  } catch (error) {
    event.reply('start-fail', que.id);
    consola.error(error);
  }
});

ipcMain.on('delete-que', async (event, queId) => {
  try {
    queMap.delete(queId);
    event.reply('delete-que-reply', queId);
  } catch (error) {
    event.reply('delete-fail', queId);
    consola.error(error);
  }
});

ipcMain.on('start-que-by-id', async (event, queId) => {
  const que = queMap.get(queId);
  try {
    await que.startProcess({ event });
    event.reply('set-que-id-reply', que.tracker);
  } catch (error) {
    event.reply('start-fail', que ? que.id : '404');
    consola.error(error);
  }
});

ipcMain.on('start-ques', async (event, req) => {
  try {
    queMap.forEach((que) => {
      que.startProcess({ event });
    });
  } catch (error) {
    // event.reply('start-fail', que.id);
    consola.error(error);
  }
});

ipcMain.on('stop-que', async (event, queId) => {
  try {
    await queMap.get(queId).stopProcess();
  } catch (error) {
    event.reply('stoped-error');
    consola.error(error);
  }
});

ipcMain.on('edit-que', (event, tracker) => {
  try {
    queMap.get(tracker.id).updateQue(tracker);
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
    https.get(url, (response) => {
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

ipcMain.on('pick-playlist-export-path', async (event, title) => {
  try {
    const path = dialog.showSaveDialogSync({
      defaultPath: title,
      filters: [{ name: 'Json', extensions: ['.json'] }]
    });
    event.reply('pick-playlist-export-path-reply', path);
  } catch (error) {
    consola.error(error);
  }
});

ipcMain.on('export-list', async (event, { exporting, path }) => {
  try {
    fs.writeFileSync(path, JSON.stringify(exporting));
    event.reply('export-done');
  } catch (error) {
    event.reply('export-fail', error);
    consola.error(error);
  }
});
