/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import path from 'path';
import os from 'os';
import { app, BrowserWindow, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import contextMenu from 'electron-context-menu';
import MenuBuilder from './menu';

let isQuitting;
let tray = null;
let trayIcon = null;

if (os.platform() !== 'win32') {
  trayIcon = path.join(__dirname, 'images/icon.png');
} else {
  trayIcon = path.join(__dirname, 'images/icon.ico');
}

if (os.platform() === 'darwin') {
  isQuitting = true;
}

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) {
  log.debug(
    "There's an instance of the application already locked, terminating..."
  );
  app.quit();
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
}

app.on('before-quit', () => {
  log.debug('Exiting application.');
  isQuitting = true;
});

app.on('window-all-closed', () => {
  app.quit();
});

contextMenu({
  prepend: (defaultActions, params) => []
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1200,
    height: 600,
    minWidth: 1200,
    minHeight: 600,
    nodeIntegration: true,
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'images/icon.png')
  });

  if (os.platform() !== 'darwin') {
    tray = new Tray(trayIcon);

    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: 'Show App',
          click() {
            if (mainWindow) {
              mainWindow.show();
            }
          }
        },
        {
          label: 'Quit',
          click() {
            isQuitting = true;
            app.quit();
          }
        }
      ])
    );

    tray.on('click', () => mainWindow.show());
  }

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('close', event => {
    event.preventDefault();
    if (!isQuitting) {
      log.debug('Closing to system tray or dock.');
      mainWindow.hide();
      event.returnValue = false;
    } else {
      mainWindow.webContents.send('handleClose');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();
});
