// @flow
import log from 'electron-log';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import counter from './counter';
import { WalletSession } from 'walletsession';
import config  from '../constants/config'

window.config = config;
log.debug('Initialized configuration file...', window.config);

window.session = new WalletSession();
window.session.wallet.start();
log.debug('Initialized wallet session ', window.session.address);

export default function createRootReducer(history: History) {
  return combineReducers<{}, *>({
    router: connectRouter(history),
    counter
  });
}
