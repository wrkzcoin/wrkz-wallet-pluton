// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

import log from 'electron-log';
import isDev from 'electron-is-dev';
import os from 'os';
import fs from 'fs';
import path from 'path';
import React, { Fragment } from 'react';
import LocalizedStrings from 'react-localization';
import ErrorBoundary from 'react-error-boundary';
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
import uiType from './utils/uitype';
import DaemonLogger from './wallet/DaemonLogger';

const homedir = os.homedir();

export const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

export const il8n = new LocalizedStrings({
  // eslint-disable-next-line global-require
  en: require('./il8n/en.json'),
  // eslint-disable-next-line global-require
  fr: require('./il8n/fr.json')
});

export function savedInInstallDir(savePath: string) {
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
eventEmitter.setMaxListeners(6);

export const updater = new AutoUpdater();
updater.getLatestVersion();

export const loginCounter = new LoginCounter();

remote.app.setAppUserModelId('wallet.proton.extra');

log.debug(`Proton wallet started...`);

const [programDirectory] = directories;

if (!fs.existsSync(`${programDirectory}/config.json`)) {
  log.debug('Config not detected, writing internal config to disk...');
} else {
  log.debug("Config file found in user's home directory, using it...");
  const rawUserConfig = fs
    .readFileSync(`${programDirectory}/config.json`)
    .toString();

  // add possible missing fields using internal config values
  try {
    config = Object.assign(config, JSON.parse(rawUserConfig));
  } catch {
    log.debug('User config is not valid JSON!');
  }
}

export const addressList = JSON.parse(
  fs.readFileSync(`${programDirectory}/addressBook.json`).toString()
);

fs.writeFile(
  `${programDirectory}/config.json`,
  JSON.stringify(config, null, 4),
  err => {
    if (err) throw err;
  }
);

const { darkMode, daemonLogPath, useLocalDaemon } = config;

export let daemonLogger = null;

if (useLocalDaemon && daemonLogPath) {
  try {
    daemonLogger = new DaemonLogger(daemonLogPath);
  } catch (error) {
    log.error('Tail initialization failed.');
    log.error(error);
  }
}

export function stopTail() {
  daemonLogger = null;
}

export function startTail(filePath?: PathLike) {
  try {
    daemonLogger = new DaemonLogger(filePath || daemonLogPath);
  } catch (error) {
    log.error('Tail initialization failed.');
    log.error(error);
  }
}

let { textColor } = uiType(darkMode);

eventEmitter.on('darkmodeon', () => {
  textColor = 'has-text-white';
});
eventEmitter.on('darkmodeoff', () => {
  textColor = 'has-text-dark';
});

try {
  // eslint-disable-next-line no-unused-vars
  let testSession = new WalletSession();
  testSession = null;
} catch (error) {
  log.debug(error);
  render(
    <div className="wholescreen has-background-black">
      <div className="elem-to-center box has-background-dark">
        <h1 className="title has-text-white has-text-centered">
          <i className="fas fa-skull" />
          &nbsp;&nbsp;Uh oh, this isn&apos;t good.
        </h1>
        <p className="has-text-white">
          Something bad happened and we couldn&apos;t open your wallet. Your
          wallet file might be corrupted or have been moved.
        </p>
        <br />
        <p className="has-text-white">{error.stack}</p>
      </div>
    </div>,
    document.getElementById('root')
  );
}

export let session = new WalletSession();

if (!session.loginFailed && !session.firstStartup) {
  log.debug('Initialized wallet session ', session.address);
  startWallet();
} else {
  log.debug('Login failed, redirecting to login...');
}

function handleDonate() {
  eventEmitter.emit('goToDonate');
}

ipcRenderer.on('handleDonate', handleDonate);
eventEmitter.on('handleDonate', handleDonate);

ipcRenderer.on('handleClose', () => {
  if (session && !session.loginFailed && !session.firstStartup) {
    const saved = session.saveWallet(session.walletFile);
    if (saved) {
      remote.app.exit();
    }
  } else {
    remote.app.exit();
  }
});

let latestUpdate = '';

eventEmitter.on('updateRequired', updateFile => {
  latestUpdate = updateFile;
  const message = (
    <div>
      <center>
        <p className={`subtitle ${textColor}`}>New Version Available!</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        There&apos;s a new version of Proton Wallet available. Would you like to
        download it?
      </p>
    </div>
  );
  eventEmitter.emit(
    'openModal',
    message,
    'Download',
    `Not Right Now`,
    'getUpdate'
  );
});

eventEmitter.on('getUpdate', () => {
  remote.shell.openExternal(latestUpdate);
  remote.app.exit();
});

ipcRenderer.on('handleSaveSilent', () => {
  if (session && !session.loginFailed && !session.firstStartup) {
    const saved = session.saveWallet(session.walletFile);
    if (saved) {
      log.debug(`Wallet saved at ${session.walletFile}`);
    }
  }
});

ipcRenderer.on('handleSave', () => {
  if (session && !session.wallet) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  if (session) {
    const saved = session.saveWallet(session.walletFile);
    if (saved) {
      const message = (
        <div>
          <center>
            <p className={`subtitle ${textColor}`}>Wallet Saved!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The wallet was saved successfully.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
    } else {
      const message = (
        <div>
          <center>
            <p className="subtitle has-text-danger">Save Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The wallet did not save successfully. Check your directory
            permissions and try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
    }
  }
});

ipcRenderer.on('handleLock', () => {
  if (session && loginCounter.isLoggedIn && session.walletPassword !== '') {
    eventEmitter.emit('logOut');
  }
});

ipcRenderer.on('handleSaveAs', () => {
  if (session && !session.wallet) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'TurtleCoin Wallet File (v0)',
        extensions: ['wallet']
      }
    ]
  };
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }
  if (session) {
    const saved = session.saveWallet(savePath);
    if (saved) {
      const message = (
        <div>
          <center>
            <p className={`subtitle ${textColor}`}>Wallet Saved!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The wallet was saved successfully.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
    }
  }
});

ipcRenderer.on('exportToCSV', () => {
  if ((session && !session.wallet) || !loginCounter.isLoggedIn) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  if (session) {
    const options = {
      defaultPath: remote.app.getPath('documents'),
      filters: [
        {
          name: 'CSV Text File',
          extensions: ['csv']
        }
      ]
    };
    const savePath = remote.dialog.showSaveDialog(null, options);
    if (savePath === undefined) {
      return;
    }
    log.debug(`Exporting transactions to csv file at ${savePath}`);
    if (session) {
      session.exportToCSV(savePath);
      const message = (
        <div>
          <center>
            <p className={`subtitle ${textColor}`}>CSV Exported!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Your transaction history has been exported to a .csv file at
            {savePath}
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
    }
  }
});

function handleOpen() {
  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'TurtleCoin Wallet File (v0)',
        extensions: ['wallet']
      }
    ]
  };
  const getPaths = remote.dialog.showOpenDialog(null, options);
  log.debug(getPaths);
  if (getPaths === undefined) {
    return;
  }
  if (session) {
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
      const message = (
        <div>
          <center>
            <p className="subtitle has-text-danger">Wallet Open Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Your wallet did not open successfully. Try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
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
      const message = (
        <div>
          <center>
            <p className="subtitle has-text-danger">Wallet Open Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Your wallet did not open successfully. Try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
    }
  }
}

eventEmitter.on('sendNotification', function sendNotification(amount) {
  const { notifications } = config;

  if (notifications) {
    const notif = new window.Notification('Transaction Received!', {
      body: `${il8n.just_received} ${amount} ${il8n.TRTL}`
    });
    if (notif) {
      log.debug(`Sent notification: You've just received ${amount} TRTL.`);
    }
  }
});

ipcRenderer.on('handleOpen', handleOpen);
eventEmitter.on('handleOpen', handleOpen);

ipcRenderer.on('failedDaemonInit', failedDaemonInit);

function handleAbout() {
  remote.shell.openExternal(
    'http://github.com/turtlecoin/turtle-wallet-proton#readme'
  );
}

function handleHelp() {
  remote.shell.openExternal('https://discord.gg/P7urHQs');
}

function handleIssues() {
  remote.shell.openExternal(
    'https://github.com/turtlecoin/turtle-wallet-proton/issues'
  );
}

eventEmitter.on('handleHelp', handleHelp);
eventEmitter.on('handleAbout', handleAbout);
eventEmitter.on('handleIssues', handleIssues);

function failedDaemonInit() {
  loginCounter.daemonFailedInit = true;
  if (session) {
    session.modifyConfig('useLocalDaemon', false);
  }
  const message = (
    <div>
      <center>
        <p className="subtitle has-text-danger">Local Daemon Error!</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        Your daemon failed to initialize, and you have been placed back in
        remote node mode automatically. You can check the log output of
        TurtleCoind in the Terminal tab.
      </p>
    </div>
  );
  eventEmitter.emit('openModal', message, 'OK', null, 'initializeNewSession');
}

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

export function saveNew(wallet: any, password: string) {
  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'TurtleCoin Wallet File (v0)',
        extensions: ['wallet']
      }
    ]
  };
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }
  if (session) {
    session.saveWallet(session.walletFile);
  }
  if (savedInInstallDir(savePath)) {
    const message = (
      <div>
        <center>
          <p className="subtitle has-text-danger">Wallet Save Error!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          You can not save the wallet in the installation directory. The windows
          installer will delete all files in the directory upon upgrading the
          application, so it is not allowed. Please save the wallet somewhere
          else.
        </p>
      </div>
    );
    eventEmitter.emit('openModal', message, 'OK', null, null);
    return;
  }
  const createdSuccessfuly = session.handleNewWallet(
    wallet,
    savePath,
    password
  );
  if (createdSuccessfuly === false) {
    const message = (
      <div>
        <center>
          <p className="subtitle has-text-danger">Wallet Creation Error!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          The wallet was not created successfully. Check your directory
          permissions and try again.
        </p>
      </div>
    );
    eventEmitter.emit('openModal', message, 'OK', null, null);
  } else {
    const savedSuccessfully = session.handleWalletOpen(savePath);
    if (savedSuccessfully === true) {
      session = null;
      session = new WalletSession(password);
      startWallet();
      const message = (
        <div>
          <center>
            <p className={`subtitle ${textColor}`}>Success!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Your new wallet was created successfully.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'goHome');
    }
  }
}

function handleNew() {
  eventEmitter.emit('goToNewWallet');
}

ipcRenderer.on('handleNew', handleNew);
eventEmitter.on('handleNew', handleNew);

function handleBackup() {
  if ((session && !session.wallet) || !loginCounter.isLoggedIn) {
    eventEmitter.emit('refreshLogin');
    return;
  }
  const message = (
    <div>
      <center>
        <p className={`subtitle ${textColor}`}>Backup</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        How would you like to back up your keys?
      </p>
    </div>
  );
  eventEmitter.emit(
    'openModal',
    message,
    'Copy to Clipboard',
    null,
    'backupToClipboard',
    'Save to File',
    'backupToFile'
  );
}

function restartApplication() {
  if (!isDev) {
    remote.app.relaunch();
    remote.app.quit();
  } else {
    log.debug(`Can't restart automatically in dev mode`);
  }
}
eventEmitter.on('restartApplication', restartApplication);

eventEmitter.on('backupToFile', backupToFile);

function getWalletSecret(wallet?: any) {
  const walletToBackup = wallet || session.wallet;

  const publicAddress = walletToBackup.getPrimaryAddress();
  const [
    privateSpendKey,
    privateViewKey
  ] = walletToBackup.getPrimaryAddressPrivateKeys();
  // eslint-disable-next-line prefer-const
  let [mnemonicSeed, err] = walletToBackup.getMnemonicSeed();
  if (err) {
    if (err.errorCode === 41) {
      mnemonicSeed = '';
    } else {
      throw err;
    }
  }

  const secret =
    // eslint-disable-next-line prefer-template
    publicAddress +
    `\n\n${il8n.private_spend_key_colon}\n\n` +
    privateSpendKey +
    `\n\n${il8n.private_view_key_colon}\n\n` +
    privateViewKey +
    (mnemonicSeed !== '' ? `\n\n${il8n.mnemonic_seed_colon}\n\n` : '') +
    mnemonicSeed +
    `\n\n${il8n.please_save_your_keys}`;

  return secret;
}

export function backupToFile(wallet?: any) {
  if (!session && !wallet) {
    return;
  }

  const secret = getWalletSecret(wallet || undefined);

  const options = {
    defaultPath: remote.app.getPath('documents'),
    filters: [
      {
        name: 'Text File',
        extensions: ['txt']
      }
    ]
  };
  const savePath = remote.dialog.showSaveDialog(null, options);
  if (savePath === undefined) {
    return;
  }

  fs.writeFile(savePath, secret, error => {
    if (error) {
      throw error;
    }
  });
}

eventEmitter.on('backupToClipboard', backupToClipboard);

function backupToClipboard() {
  if (!session) {
    return;
  }

  const secret = getWalletSecret();

  clipboard.writeText(secret);
}

ipcRenderer.on('handleBackup', handleBackup);
eventEmitter.on('handleBackup', handleBackup);

function handleImport() {
  log.debug('User selected to import wallet.');
  const message = (
    <div>
      <center>
        <p className={`title ${textColor}`}>Select Import Type</p>
      </center>
      <br />
      <p className={`subtitle ${textColor}`}>
        Would you like to import from seed or keys?
      </p>
    </div>
  );
  eventEmitter.emit(
    'openModal',
    message,
    'Seed',
    null,
    'importSeed',
    'Keys',
    'importKey'
  );
}

eventEmitter.on('handleImport', handleImport);
ipcRenderer.on('handleImport', handleImport);

const store = configureStore();

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

// eslint-disable-next-line no-unused-vars
const uncaughtErrorHandler = (error: Error, componentStack: string) => {
  log.debug(error);
};

// eslint-disable-next-line react/prop-types
const uncaughtErrorComponent = ({ componentStack, error }) => (
  <div className="wholescreen has-background-black">
    <div className="elem-to-center box has-background-dark">
      <h1 className="title has-text-white has-text-centered">
        <i className="fas fa-skull" />
        &nbsp;&nbsp;Uh oh, this isn&apos;t good.
      </h1>
      <p className="has-text-white">
        Something bad happened and we couldn&apos;t open your wallet. This is
        probably a programmer error. Error details are below.
      </p>
      <br />
      <p className="has-text-white">{error.toString()}</p>
      <p className="has-text-white">{componentStack}</p>
    </div>
  </div>
);

async function startWallet() {
  if (session) {
    try {
      await session.wallet.start();
    } catch {
      log.debug('Password required, redirecting to login...');
      loginCounter.isLoggedIn = true;
      eventEmitter.emit('loginFailed');
    }
    eventEmitter.emit('gotNodeFee');
  }
}

function activityDetected() {
  eventEmitter.emit('activityDetected');
}

render(
  <AppContainer>
    <ErrorBoundary
      onError={uncaughtErrorHandler}
      FallbackComponent={uncaughtErrorComponent}
    >
      <div
        onClick={activityDetected}
        onKeyPress={activityDetected}
        role="button"
        tabIndex={0}
      >
        <Root store={store} history={history} />
      </div>
    </ErrorBoundary>
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <div
          onClick={activityDetected}
          onKeyPress={activityDetected}
          role="button"
          tabIndex={0}
        >
          <NextRoot store={store} history={history} />{' '}
        </div>
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
