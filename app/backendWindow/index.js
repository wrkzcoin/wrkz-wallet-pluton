// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import fs from 'fs';
import { ipcRenderer, IpcRendererEvent, clipboard, remote } from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import Backend from './Backend';

let backend: Backend | null = null;

ipcRenderer.on('fromMain', (event: IpcRendererEvent, message: any) => {
  parseMessage(message);
});

ipcRenderer.on('fromFrontend', (event: IpcRendererEvent, message: any) => {
  parseMessage(message);
});

async function parseMessage(message: any) {
  const { messageType, data } = message;
  switch (messageType) {
    case 'config':
      if (data.walletFile !== '') {
        backend = new Backend(data);
      }
      break;
    case 'showDevConsole':
      if (isDev) {
        remote.getCurrentWebContents().toggleDevTools();
      } else {
        remote.getCurrentWebContents().openDevTools({ mode: 'detach' });
      }
      break;
    case 'stopRequest':
      if (backend) {
        await backend.stop(true);
      } else {
        ipcRenderer.send('backendStopped');
      }
      break;
    case 'transactionSearchQuery':
      await backend.transactionSearch(data);
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
      await backend.rescanWallet(data);
      break;
    case 'changeNode':
      await backend.changeNode(data);
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
      if (backend) {
        await backend.stop(false);
        backend = null;
      }
      break;
    case 'walletPassword':
      await backend.startWallet(data);
      break;
    case 'verifyWalletPassword':
      backend.verifyPassword(data);
      break;
    case 'changePasswordRequest':
      backend.changePassword(data);
      break;
    case 'transactionRequest':
      // data is the amount of transactions to get
      await backend.getTransactions(data);
      break;
    case 'prepareTransactionRequest':
      await backend.prepareTransaction(data);
      break;
    case 'sendTransactionRequest':
      await backend.sendTransaction(data);
      break;
    default:
      log.info(`UNSUPPORTED: ${message}`);
      break;
  }
}
