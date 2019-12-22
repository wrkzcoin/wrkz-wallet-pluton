// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { Daemon, WalletBackend, LogLevel } from 'turtlecoin-wallet-backend';
import { ipcRenderer } from 'electron';

export default class Backend {
  daemon: Daemon;

  daemonHost: string;

  daemonPort: number;

  walletFile: string;

  walletPassword: string = '';

  wallet: any;

  walletActive: boolean = false;

  constructor(config: any) {
    this.daemonHost = config.daemonHost;
    this.daemonPort = config.daemonPort;
    this.walletFile = config.walletFile;
    this.logLevel = config.logLevel;
    this.daemon = new Daemon(this.daemonHost, this.daemonPort);
  }

  getWalletActive(): boolean {
    return this.walletActive;
  }

  setWalletActive(state: boolean): void {
    this.walletActive = state;
  }

  evaluateLogLevel(logLevel: string) {
    switch (logLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARNING':
        return LogLevel.WARNING;
      case 'TRACE':
        return LogLevel.TRACE;
      default:
        return LogLevel.DISABLED;
    }
  }

  verifyPassword(password: string): void {
    ipcRenderer.send(
      'fromBackend',
      'authenticationStatus',
      password === this.walletPassword
    );
  }

  openWallet(password: string): void {
    this.walletPassword = password;
    const [openWallet, error] = WalletBackend.openWalletFromFile(
      this.daemon,
      this.walletFile,
      this.walletPassword
    );
    if (!error) {
      this.wallet = openWallet;
      this.wallet.setLogLevel(this.evaluateLogLevel(this.logLevel));
      this.wallet.start();
      this.setWalletActive(true);
      ipcRenderer.send('fromBackend', 'authenticationStatus', true);
      ipcRenderer.send('fromBackend', 'walletActiveStatus', true);
      console.log('wallet started.');
    } else {
      ipcRenderer.send('fromBackend', 'authenticationStatus', false);
      console.log(error);
    }
  }
}
