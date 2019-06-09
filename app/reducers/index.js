// @flow
import log from 'electron-log';
import os from 'os';
import fs from 'fs';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import counter from './counter';
import WalletSession from '../wallet/session';
import config from '../constants/config';

const homedir = os.homedir();
const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`,
  `${homedir}/.protonwallet/wallets`
];
window.directories = directories;
// eslint-disable-next-line no-unused-vars
const [programDirectory, logDirectory, walletDirectory] = directories;
log.debug('Checking if program directories are present...');
directories.forEach(function(dir) {
  if (!fs.existsSync(dir)) {
    log.debug(
      'No directories detected, initial startup detected. Running setup...'
    );
    fs.mkdirSync(dir);
  }
});

window.config = config;
log.debug('Initialized configuration file...');

window.session = new WalletSession();
window.session.wallet.start();
log.debug('Initialized wallet session ', window.session.address);

const walletLogStream = fs.createWriteStream(`${logDirectory}/divinewallet.log`, {
  flags: 'a'
});

window.session.wallet.saveWalletToFile(
  `${walletDirectory}/proton.wallet`,
  'hunter2'
);

export default function createRootReducer(history: History) {
  return combineReducers<{}, *>({
    router: connectRouter(history),
    counter
  });
}
