// @flow
import log from 'electron-log';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import counter from './counter';
import { WalletSession } from '../wallet/session';

window.session = new WalletSession();
window.session.wallet.start();
log.debug('Initialized wallet session ', window.session.address);

function updateSync() {

}

export default function createRootReducer(history: History) {
  return combineReducers<{}, *>({
    router: connectRouter(history),
    counter
  });
}
