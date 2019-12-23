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

  getFormattedTransactions(
    startIndex?: number,
    numTransactions?: number,
    includeFusions?: boolean
  ) {
    const rawTransactions = this.wallet.getTransactions(
      startIndex,
      numTransactions,
      includeFusions || false
    );
    const [unlockedBalance, lockedBalance] = this.wallet.getBalance();
    let balance = parseInt(unlockedBalance + lockedBalance, 10);
    const transactions = [];

    for (const [index, tx] of rawTransactions.entries()) {
      transactions.push([
        tx.timestamp,
        tx.hash,
        tx.totalAmount(),
        balance,
        tx.blockHeight,
        tx.paymentID,
        index,
        tx.fee,
        tx.unlockTime
      ]);
      balance -= parseInt(tx.totalAmount(), 10);
    }
    return transactions;
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
      ipcRenderer.send(
        'fromBackend',
        'primaryAddress',
        this.wallet.getPrimaryAddress()
      );
      ipcRenderer.send(
        'fromBackend',
        'transactionList',
        this.getFormattedTransactions(0, 50, false)
      );
      ipcRenderer.send('fromBackend', 'walletActiveStatus', true);
      ipcRenderer.send('fromBackend', 'authenticationStatus', true);
      console.log('wallet started.');
    } else {
      ipcRenderer.send('fromBackend', 'authenticationStatus', false);
      console.log(error);
    }
  }
}
