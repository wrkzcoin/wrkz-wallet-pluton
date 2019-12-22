// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { ipcRenderer } from 'electron';
import Backend from './Backend';

let config = null;
let backend = null;

ipcRenderer.on('fromMain', (event: Electron.IpcRendererEvent, message: any) => {
  parseMessage(message);
});

ipcRenderer.on(
  'fromFrontend',
  (event: Electron.IpcRendererEvent, message: any) => {
    parseMessage(message);
  }
);

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
    default:
      console.log(message);
      break;
  }
}
