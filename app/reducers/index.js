// @flow
import log from 'electron-log';
import os from 'os';
import fs from 'fs';
import { LogLevel } from 'turtlecoin-wallet-backend';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import counter from './counter';

export default function createRootReducer(history: History) {
  return combineReducers<{}, *>({
    router: connectRouter(history),
    counter
  });
}
