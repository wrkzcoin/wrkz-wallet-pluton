// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import fs from 'fs';
import { ipcRenderer, IpcRendererEvent, clipboard, remote } from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import Backend from './Backend';

let backend = null;

function backendUnavailable(messageType: string): boolean {
  if (backend) {
    return false;
  }
  log.warn(`Ignoring '${messageType}' request: wallet backend not initialized.`);
  return true;
}

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
        backend.stop(true);
      } else {
        ipcRenderer.send('backendStopped');
      }
      break;
    case 'transactionSearchQuery':
      if (backendUnavailable(messageType)) break;
      backend.transactionSearch(data);
      break;
    case 'notificationsRequest':
      if (backendUnavailable(messageType)) break;
      backend.setNotifications(data);
      break;
    case 'logLevelRequest':
      if (backendUnavailable(messageType)) break;
      backend.setLogLevel(data);
      break;
    case 'scanCoinbaseRequest':
      if (backendUnavailable(messageType)) break;
      backend.setScanCoinbaseTransactions(data);
      break;
    case 'AutoOptimizationRequest':
      if (backendUnavailable(messageType)) break;
      backend.setenableAutoOptimization(data);
      break;
    case 'rescanRequest':
      if (backendUnavailable(messageType)) break;
      backend.rescanWallet(data);
      break;
    case 'changeNode':
      if (backendUnavailable(messageType)) break;
      backend.changeNode(data);
      break;
    case 'backupToFile':
      if (backendUnavailable(messageType)) break;
      const key_file = await backend.getSecret();
      fs.writeFile(data, key_file, error => {
        if (error) {
          log.error(error);
        }
      });
      break;
    case 'backupToClipboard':
      if (backendUnavailable(messageType)) break;
      const keys = await backend.getSecret();
      clipboard.writeText(keys);
      break;
    case 'exportToCSV':
      if (backendUnavailable(messageType)) break;
      await backend.exportToCSV(data);
      break;
    case 'saveWallet':
      if (backendUnavailable(messageType)) break;
      backend.saveWallet(data);
      break;
    case 'saveWalletAs':
      if (backendUnavailable(messageType)) break;
      backend.saveWallet(data.notify, data.savePath);
      break;
    case 'openNewWallet':
      if (backend) {
        backend.stop(false);
        backend = null;
      }
      break;
    case 'walletPassword':
      if (backendUnavailable(messageType)) break;
      backend.startWallet(data);
      break;
    case 'verifyWalletPassword':
      if (backendUnavailable(messageType)) break;
      backend.verifyPassword(data);
      break;
    case 'changePasswordRequest':
      if (backendUnavailable(messageType)) break;
      backend.changePassword(data);
      break;
    case 'transactionRequest':
      if (backendUnavailable(messageType)) break;
      // data is the amount of transactions to get
      backend.getTransactions(data);
      break;
    case 'prepareTransactionRequest':
      if (backendUnavailable(messageType)) break;
      backend.prepareTransaction(data);
      break;
    case 'sendTransactionRequest':
      if (backendUnavailable(messageType)) break;
      backend.sendTransaction(data);
      break;
    default:
      log.info(message);
      break;
  }
}
