// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { ipcRenderer, IpcRendererEvent } from 'electron';
import log from 'electron-log';
import Backend from './Backend';

let config = null;
let backend = null;

ipcRenderer.on('fromMain', (event: IpcRendererEvent, message: any) => {
  parseMessage(message);
});

ipcRenderer.on('fromFrontend', (event: IpcRendererEvent, message: any) => {
  parseMessage(message);
});

function parseMessage(message: any) {
  const { messageType, data } = message;
  switch (messageType) {
    case 'config':
      config = data;
      backend = new Backend(config);
      break;
    case 'walletPassword':
      backend.openWallet(data);
      break;
    case 'verifyWalletPassword':
      backend.verifyPassword(data);
      break;
    case 'transactionRequest':
      // data is the amount of transactions to get
      backend.getTransactions(data);
      break;
    case 'sendTransactionRequest':
      backend.sendTransaction(data);
      break;
    default:
      log.info(message);
      break;
  }
}
