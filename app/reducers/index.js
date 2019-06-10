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

log.debug(`Proton wallet started...`);

export let config = iConfig;

const homedir = os.homedir();

export const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`,
  `${homedir}/.protonwallet/wallets`
];

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

export let session = new WalletSession();
log.debug('Initialized wallet session ', session.address);

if (config.logLevel === 'DEBUG') {
  session.wallet.setLogLevel(LogLevel.DEBUG);
  session.wallet.setLoggerCallback(
    (prettyMessage, message, level, categories) => {
      let logStream = fs.createWriteStream(logDirectory + '/protonwallet.log', {
        flags: 'a'
      });
      logStream.write(prettyMessage + '\n');
    }
  );
}

session.wallet.saveWalletToFile(`${walletDirectory}/${config.walletFile}`, '');

export default function createRootReducer(history: History) {
  return combineReducers<{}, *>({
    router: connectRouter(history),
    counter
  });
}
