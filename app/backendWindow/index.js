// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import fs from 'fs';
import { ipcRenderer, IpcRendererEvent, clipboard } from 'electron';
import log from 'electron-log';
import Backend from './Backend';

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
      backend = new Backend(data);
      break;
    case 'transactionSearchQuery':
      backend.transactionSearch(data);
      break;
    case 'notificationsRequest':
      backend.setNotifications(data);
      break;
    case 'logLevelRequest':
      backend.setLogLevel(data);
      break;
    case 'scanCoinbaseRequest':
      backend.setScanCoinbaseTransactions(data);
      break;
    case 'rescanRequest':
      backend.rescanWallet(data);
      break;
    case 'changeNode':
      backend.changeNode(data);
      break;
    case 'backupToFile':
      fs.writeFile(data, backend.getSecret(), error => {
        if (error) {
          throw error;
        }
      });
      break;
    case 'backupToClipboard':
      clipboard.writeText(backend.getSecret());
      break;
    case 'exportToCSV':
      backend.exportToCSV(data);
      break;
    case 'saveWallet':
      backend.saveWallet(data);
      break;
    case 'saveWalletAs':
      backend.saveWallet(data.notify, data.savePath);
      break;
    case 'openNewWallet':
      backend.stop();
      backend = null;
      break;
    case 'walletPassword':
      backend.startWallet(data);
      break;
    case 'verifyWalletPassword':
      backend.verifyPassword(data);
      break;
    case 'changePasswordRequest':
      backend.changePassword(data);
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
