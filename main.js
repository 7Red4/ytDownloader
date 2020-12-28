"use strict";

const { app, protocol, BrowserWindow, ipcMain, dialog } = require("electron");
const { getInfo, start } = require("./ytdl.js");
const consola = require("consola");

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: isDevelopment ? 1600 : 810,
    height: 960,

    webPreferences: {
      nodeIntegration: true,
    },
  });
  try {
    await win.loadFile("./index.html");
    win.removeMenu();
    if (isDevelopment) win.webContents.openDevTools();
  } catch (error) {
    consola.error(error);
  }
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

ipcMain.on("get-yt-info", async (event, url) => {
  try {
    const info = await getInfo(url);
    event.reply("get-yt-info-reply", info);
  } catch (error) {
    consola.error(error);
  }
});

ipcMain.on("pick-path", async (event) => {
  const path = await dialog.showOpenDialog({
    properties: ["openFile", "openDirectory", "multiSelections"],
  });

  event.reply("pick-path-reply", path);
});

ipcMain.on("download", async (event, req) => {
  try {
    await start(req, event);
  } catch (error) {
    event.reply("download-fail");
    consola.error(error);
  }
});
