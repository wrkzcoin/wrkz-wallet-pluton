/* eslint-disable func-names */
import log from 'electron-log';
import os from 'os';
import fs from 'fs';
import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import { ipcRenderer, remote } from 'electron';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import WalletSession from './wallet/session';
import iConfig from './constants/config';

export let config = iConfig;

log.debug(`Proton wallet started...`);

const homedir = os.homedir();

export const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`,
  `${homedir}/.protonwallet/wallets`
];

const [programDirectory, logDirectory, walletDirectory] = directories;

if (config.walletFile === '') {
  config.walletFile = `${walletDirectory}/default.wallet`;
}

if (!fs.existsSync(`${programDirectory}/config.json`)) {
  fs.writeFile(
    `${programDirectory}/config.json`,
    JSON.stringify(config, null, 4),
    err => {
      if (err) throw err;
      log.debug('Config not detected, wrote internal config to disk.');
    }
  );
} else {
  log.debug(
    "Config file found in user's home directory, defaulting to local config..."
  );
  const rawUserConfig = fs.readFileSync(`${programDirectory}/config.json`);
  config = JSON.parse(rawUserConfig);
}

log.debug('Checking if program directories are present...');
// eslint-disable-next-line func-names
directories.forEach(function(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    log.debug(`${dir} directories not detected, creating...`);
  } else if (dir === programDirectory) {
    log.debug('Directories found. Initializing wallet session...');
  }
});

export const session = new WalletSession();
log.debug('Initialized wallet session ', session.address);

// eslint-disable-next-line func-names
ipcRenderer.on('handleSave', function(evt, route) {
  const saved = session.saveWallet(config.walletFile);
  if (saved) {
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: 'Saved!',
      message: 'The wallet was saved successfully.'
    });
  } else {
    remote.dialog.showMessageBox(null, {
      type: 'error',
      buttons: ['OK'],
      title: 'Error!',
      message:
        'The wallet was not saved successfully. Check directory permissions and try again.'
    });
  }
});

ipcRenderer.on('handleOpen', function(evt, route) {
  const getPaths = remote.dialog.showOpenDialog();
  if (getPaths === undefined) {
    return;
  }
  const selectedPath = getPaths[0];
  const savedSuccessfully = session.handleWalletOpen(selectedPath);
  if (savedSuccessfully === true) {
    remote.app.relaunch();
    remote.app.exit();
  } else {
    remote.dialog.showMessageBox(null, {
      type: 'error',
      buttons: ['OK'],
      title: 'Error opening wallet!',
      message: 'The wallet was not opened successfully. Try again.'
    });
  }
});

if (config.logLevel === 'DEBUG') {
  session.wallet.setLogLevel(LogLevel.DEBUG);
  session.wallet.setLoggerCallback(
    (prettyMessage, message, level, categories) => {
      const logStream = fs.createWriteStream(
        `${logDirectory}/protonwallet.log`,
        {
          flags: 'a'
        }
      );
      logStream.write(`${prettyMessage}\n`);
    }
  );
}

const store = configureStore();

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
