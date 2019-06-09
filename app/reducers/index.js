// @flow
import log from 'electron-log';
import os from 'os';
import fs from 'fs';
import { LogLevel } from 'turtlecoin-wallet-backend';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import counter from './counter';
import WalletSession from '../wallet/session';
import iConfig from '../constants/config';

log.debug(`Proton wallet started...`)

let config = iConfig;

const homedir = os.homedir();
const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`,
  `${homedir}/.protonwallet/wallets`
];
window.directories = directories;
const [programDirectory, logDirectory, walletDirectory] = directories;

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
  log.debug("Config file found in user's home directory, defaulting to local config...")
  const rawUserConfig = fs.readFileSync(`${programDirectory}/config.json`);
  config = JSON.parse(rawUserConfig);
}

log.debug('Checking if program directories are present...');
// eslint-disable-next-line func-names
directories.forEach(function(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
      log.debug(
        `${dir} directories not detected, creating...`
      );
  } else {
    if (dir === programDirectory) {
      log.debug('Directories found. Initializing wallet session...')
    }
  }
});

window.config = config;

window.session = new WalletSession();
window.session.wallet.start();
log.debug('Initialized wallet session ', window.session.address);


if (window.config.logLevel === 'DEBUG') {
    window.session.wallet.setLogLevel(LogLevel.DEBUG);
    window.session.wallet.setLoggerCallback((prettyMessage, message, level, categories) => {
        let logStream = fs.createWriteStream(logDirectory + '/protonwallet.log', {
            flags: 'a'
        });
        logStream.write(prettyMessage + '\n');
  });
}

window.session.wallet.on('transaction', transaction => {
  log.debug(`Transaction of ${transaction.totalAmount()} received!`);
});

window.session.wallet.on('sync', (walletHeight, networkHeight) => {
  log.debug(
    `Wallet synced! Wallet height: ${walletHeight}, Network height: ${networkHeight}`
  );
});

window.session.wallet.on('desync', (walletHeight, networkHeight) => {
  log.debug(
    `Wallet is no longer synced! Wallet height: ${walletHeight}, Network height: ${networkHeight}`
  );
});

window.session.wallet.saveWalletToFile(
  `${walletDirectory}/${config.walletFile}`,
  ''
);

export default function createRootReducer(history: History) {
  return combineReducers<{}, *>({
    router: connectRouter(history),
    counter
  });
}
