/* eslint-disable global-require */
import log from 'electron-log';
import os from 'os';
import fs from 'fs';
import path from 'path';
import React, { Fragment } from 'react';
import LocalizedStrings from 'react-localization';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import { ipcRenderer, remote, clipboard } from 'electron';
import { WalletBackend } from 'turtlecoin-wallet-backend';
import EventEmitter from 'events';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import './app.global.css';
import WalletSession from './wallet/session';
import iConfig from './constants/config';
import AutoUpdater from './wallet/autoUpdater';
import LoginCounter from './wallet/loginCounter';

export const il8n = new LocalizedStrings({
  en: require('./il8n/en.json'),
  fr: require('./il8n/fr.json')
});

export function savedInInstallDir(savePath) {
  const installationDirectory = path.resolve(remote.app.getAppPath(), '../../');
  const saveAttemptDirectory = path.resolve(savePath, '../');
  if (
    saveAttemptDirectory === installationDirectory &&
    os.platform() === 'win32'
  ) {
    return true;
  }
  return false;
}

export let config = iConfig;

export const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(5);

export const updater = new AutoUpdater();
updater.getLatestVersion();

export const loginCounter = new LoginCounter();

remote.app.setAppUserModelId('wallet.proton.extra');

log.debug(`Proton wallet started...`);

const homedir = os.homedir();

export const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

const [programDirectory] = directories;

log.debug('Checking if program directories are present...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    log.debug(`${dir} directories not detected, creating...`);
  } else if (dir === programDirectory) {
    log.debug('Directories found. Initializing wallet session...');
  }
});

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
  log.debug("Config file found in user's home directory, using it...");
  const rawUserConfig = fs
    .readFileSync(`${programDirectory}/config.json`)
    .toString();
  config = JSON.parse(rawUserConfig);
}

export let session = new WalletSession();

if (!session.loginFailed && !session.firstStartup) {
  log.debug('Initialized wallet session ', session.address);
  startWallet();
} else {
  log.debug('Login failed, redirecting to login...');
}

ipcRenderer.on('handleClose', () => {
  if (!session.loginFailed && !session.firstStartup) {
    const saved = session.saveWallet(session.walletFile);
    if (saved) {
      remote.app.exit();
    }
  } else {
    remote.app.exit();
  }
});

eventEmitter.on('updateRequired', updateFile => {
  const userResponse = remote.dialog.showMessageBox(null, {
    type: 'info',
    buttons: [il8n.cancel, il8n.ok],
    title: il8n.update_required,
    message: `${il8n.new_update}`
  });
  if (userResponse === 1) {
    remote.shell.openExternal(updateFile);
    remote.app.exit();
  }
});

ipcRenderer.on('handleSaveSilent', () => {
  if (!session.loginFailed && !session.firstStartup) {
    const saved = session.saveWallet(session.walletFile);
    if (saved) {
      log.debug(`Wallet saved at ${session.walletFile}`);
    }
  }
});

ipcRenderer.on('handleSave', () => {
  if (!session.wallet) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const saved = session.saveWallet(session.walletFile);
  if (saved) {
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: [il8n.ok],
      title: il8n.change_passwd_passwd_change_success_title,
      message: il8n.saved_successfully
    });
  } else {
    remote.dialog.showMessageBox(null, {
      type: 'error',
      buttons: [il8n.ok],
      title: [il8n.change_passwd_passwd_change_unsuccess_title],
      message: il8n.not_saved_successfully
    });
  }
});

ipcRenderer.on('handleSaveAs', () => {
  if (!session.wallet) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const options = {
    defaultPath: remote.app.getPath('documents')
  };
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }
  session.saveWallet(savePath);
  remote.dialog.showMessageBox(null, {
    type: 'info',
    buttons: [il8n.ok],
    title: il8n.change_passwd_passwd_change_success_title,
    message: il8n.saved_successfully
  });
});

ipcRenderer.on('exportToCSV', () => {
  if (!session.wallet) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const options = {
    defaultPath: remote.app.getPath('documents')
  };
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }
  log.debug(`Exporting transactions to csv file at ${savePath}.csv...`);
  session.exportToCSV(savePath);
  remote.dialog.showMessageBox(null, {
    type: 'info',
    buttons: [il8n.ok],
    title: il8n.change_passwd_passwd_change_success_title,
    message: `${il8n.exported_csv} ${savePath} ${il8n.dot_csv}`
  });
});

function handleOpen() {
  const options = {
    defaultPath: remote.app.getPath('documents')
  };
  const getPaths = remote.dialog.showOpenDialog(null, options);
  if (getPaths === undefined) {
    return;
  }
  loginCounter.userLoginAttempted = false;
  loginCounter.lastLoginAttemptFailed = false;
  loginCounter.loginsAttempted = 0;
  session.loginFailed = false;
  session.saveWallet(session.walletFile);
  const [, error] = WalletBackend.openWalletFromFile(
    session.daemon,
    getPaths[0],
    ''
  );
  if (error && error.errorCode !== 5) {
    log.debug(`Failed to open wallet: ${error.toString()}`);
    remote.dialog.showMessageBox(null, {
      type: 'error',
      buttons: [il8n.ok],
      title: il8n.title_error_opening_wallet,
      message: il8n.error_opening_wallet
    });
    return;
  }
  if (error !== undefined) {
    if (error.errorCode === 5) {
      log.debug('Login to wallet failed, firing event...');
    }
  }
  const selectedPath = getPaths[0];
  const savedSuccessfully = session.handleWalletOpen(selectedPath);
  if (savedSuccessfully === true) {
    session = null;
    session = new WalletSession();
    startWallet();
    eventEmitter.emit('refreshLogin');
    eventEmitter.emit('openNewWallet');
  } else {
    remote.dialog.showMessageBox(null, {
      type: 'error',
      buttons: [il8n.ok],
      title: il8n.title_error_opening_wallet,
      message: il8n.error_opening_wallet
    });
  }
}

eventEmitter.on('sendNotification', function sendNotification(amount) {
  const notif = new window.Notification('Transaction Received!', {
    body: `${il8n.just_received} ${amount} ${session.wallet.config.ticker}`
  });
  if (notif) {
    log.debug(
      `Sent notification: You've just received ${amount} ${
        session.wallet.config.ticker
      }`
    );
  }
});

ipcRenderer.on('handleOpen', handleOpen);
eventEmitter.on('handleOpen', handleOpen);

eventEmitter.on('initializeNewNode', (password, daemonHost, daemonPort) => {
  session = null;
  session = new WalletSession(password, daemonHost, daemonPort);
  startWallet();
  eventEmitter.emit('newNodeConnected');
  session.firstLoadOnLogin = false;
});

eventEmitter.on('initializeNewSession', password => {
  session = null;
  session = new WalletSession(password);
  startWallet();
  eventEmitter.emit('openNewWallet');
});

function handleNew() {
  const options = {
    defaultPath: remote.app.getPath('documents')
  };
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }
  session.saveWallet(session.walletFile);
  if (savedInInstallDir(savePath)) {
    remote.dialog.showMessageBox(null, {
      type: 'error',
      buttons: [il8n.ok],
      title: il8n.title_no_saving_in_install_dir,
      message: il8n.no_saving_in_install_dir
    });
    return;
  }
  const createdSuccessfuly = session.handleNewWallet(savePath);
  if (createdSuccessfuly === false) {
    remote.dialog.showMessageBox(null, {
      type: 'error',
      buttons: ['OK'],
      title: il8n.title_error_creating_wallet,
      message: il8n.not_created_successfully
    });
  } else {
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: il8n.title_created,
      message: il8n.created_successfully
    });
    const savedSuccessfully = session.handleWalletOpen(savePath);
    if (savedSuccessfully === true) {
      session = null;
      session = new WalletSession();
      startWallet();
      eventEmitter.emit('handlePasswordChange');
    } else {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: il8n.title_error_opening_wallet,
        message: il8n.error_opening_wallet
      });
    }
  }
}

ipcRenderer.on('handleNew', handleNew);
eventEmitter.on('handleNew', handleNew);

ipcRenderer.on('handleBackup', () => {
  if (!session.wallet || !loginCounter.isLoggedIn) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const publicAddress = session.wallet.getPrimaryAddress();
  const [
    privateSpendKey,
    privateViewKey
  ] = session.wallet.getPrimaryAddressPrivateKeys();
  const [mnemonicSeed, err] = session.wallet.getMnemonicSeed();
  log.debug(err);

  const msg =
    // eslint-disable-next-line prefer-template
    publicAddress +
    `\n\n${il8n.private_spend_key_colon}\n\n` +
    privateSpendKey +
    `\n\n${il8n.private_view_key_colon}\n\n` +
    privateViewKey +
    `\n\n${il8n.mnemonic_seed_colon}\n\n` +
    mnemonicSeed +
    `\n\n${il8n.please_save_your_keys}`;

  const userSelection = remote.dialog.showMessageBox(null, {
    type: 'info',
    buttons: [il8n.copy_to_clipboard, il8n.cancel],
    title: il8n.backup,
    message: msg
  });
  if (userSelection === 0) {
    clipboard.writeText(msg);
  }
});

const store = configureStore();

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

async function startWallet() {
  try {
    await session.wallet.start();
  } catch {
    log.debug('Password required, redirecting to login...');
    loginCounter.isLoggedIn = true;
    eventEmitter.emit('loginFailed');
  }
  eventEmitter.emit('gotNodeFee');
}

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
