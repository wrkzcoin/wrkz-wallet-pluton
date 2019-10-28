// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import path from 'path';
import os from 'os';
import fs from 'fs';
import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  shell,
  dialog,
  ipcMain
} from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import contextMenu from 'electron-context-menu';
import MenuBuilder from './menu';
import iConfig from './constants/config';
import packageInfo from '../package.json';

/** disable background throttling so our sync
 *   speed doesn't crap out when minimized
 */
app.commandLine.appendSwitch('disable-background-timer-throttling');

const { version } = packageInfo;

let isQuitting;
let tray = null;
let trayIcon = null;
let config = null;
const homedir = os.homedir();

const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

const [programDirectory] = directories;

log.debug('Checking if program directories are present...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    log.debug(`${dir} directories not detected, creating...`);
  }
});

if (fs.existsSync(`${programDirectory}/config.json`)) {
  const rawUserConfig = fs
    .readFileSync(`${programDirectory}/config.json`)
    .toString();

  // check if the user config is valid JSON before parsing it
  try {
    config = JSON.parse(rawUserConfig);
  } catch {
    // if it isn't, set the internal config to the user config
    config = iConfig;
  }
}

if (fs.existsSync(`${programDirectory}/addressBook.json`)) {
  const rawAddressBook = fs
    .readFileSync(`${programDirectory}/addressBook.json`)
    .toString();

  // check if the user addressBook is valid JSON before parsing it
  try {
    JSON.parse(rawAddressBook);
  } catch {
    // if it isn't, backup the invalid JSON and overwrite it with an empty addressBook
    fs.copyFileSync(
      `${programDirectory}/addressBook.json`,
      `${programDirectory}/addressBook.notvalid.json`
    );
    fs.writeFileSync(`${programDirectory}/addressBook.json`, '[]');
  }
} else {
  fs.writeFileSync(`${programDirectory}/addressBook.json`, '[]');
}

const daemonLogFile = path.resolve(directories[1], 'TurtleCoind.log');
const backendLogFile = path.resolve(directories[1], 'wallet-backend.log');
fs.closeSync(fs.openSync(daemonLogFile, 'w'));

try {
  fs.closeSync(fs.openSync(backendLogFile, 'wx'));
} catch {
  log.debug('Backend log file found.');
}

if (config) {
  isQuitting = !config.closeToTray;
}

if (os.platform() !== 'win32') {
  trayIcon = path.join(__dirname, 'images/icon_color_64x64.png');
} else {
  trayIcon = path.join(__dirname, 'images/icon.ico');
}

if (os.platform() === 'darwin') {
  isQuitting = true;
}

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line global-require
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  // eslint-disable-next-line global-require
  require('electron-debug')();
}

const installExtensions = async () => {
  // eslint-disable-next-line global-require
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
  showInspectElement: isDev,
  showSaveImage: false,
  showCopyImage: false,
  showCopyLink: false,
  prepend: (defaultActions, params) => [
    {
      label: 'Search block explorer for this hash',
      // Only show it when right-clicking a hash
      visible: params.selectionText.trim().length === 64,
      click: () => {
        shell.openExternal(
          `https://explorer.turtlecoin.lol/?search=${encodeURIComponent(
            params.selectionText
          )}`
        );
      }
    },
    {
      label: 'Cut',
      role: 'cut',
      enabled: false,
      visible:
        params.linkURL.includes('#addressinput') &&
        params.inputFieldType !== 'plainText'
    },
    {
      label: 'Copy',
      role: 'copy',
      enabled: false,
      visible:
        params.linkURL.includes('#addressinput') &&
        params.inputFieldType !== 'plainText'
    },
    {
      label: 'Paste',
      role: 'paste',
      visible:
        params.linkURL.includes('#addressinput') &&
        params.inputFieldType !== 'plainText'
    }
  ]
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    title: `Proton v${version}`,
    useContentSize: true,
    show: false,
    width: 1250,
    height: 625,
    minWidth: 1250,
    minHeight: 625,
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      nativeWindowOpen: true,
      nodeIntegrationInWorker: true,
      nodeIntegration: true
    }
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

    tray.on('click', () => showMainWindow());
  }

  mainWindow.loadURL(`file://${__dirname}/app.html`);

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
    if (!isQuitting && mainWindow) {
      log.debug('Closing to system tray or dock.');
      mainWindow.hide();
    } else if (mainWindow) {
      mainWindow.webContents.send('handleClose');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('unresponsive', () => {
    // catch the unresponsive event
    const userSelection = dialog.showMessageBox(mainWindow, {
      type: 'error',
      buttons: ['Kill', `Don't Kill`],
      title: 'Unresponse Application',
      message: 'The application is unresponsive. Would you like to kill it?'
    });
    if (userSelection === 0) {
      process.exit(1);
    }
  });

  process.on('uncaughtException', () => {
    // catch uncaught exceptions in the main process
    dialog.showErrorBox(
      'Uncaught Error',
      'An unexpected error has occurred. Please report this error, and what you were doing to cause it.'
    );
    process.exit(1);
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});

function showMainWindow() {
  if (mainWindow) {
    mainWindow.show();
  }
}

ipcMain.on('closeToTrayToggle', (event: any, state: boolean) => {
  toggleCloseToTray(state);
});

function toggleCloseToTray(state: boolean) {
  isQuitting = !state;
}
