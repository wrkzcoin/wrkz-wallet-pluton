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

  lastTxAmountRequested: number = 50;

  constructor(config: any): Backend {
    this.daemonHost = config.daemonHost;
    this.daemonPort = config.daemonPort;
    this.walletFile = config.walletFile;
    this.logLevel = config.logLevel;
    this.daemon = new Daemon(this.daemonHost, this.daemonPort);
  }

  getNodeFee(): void {
    ipcRenderer.send('fromBackend', 'nodeFee', this.wallet.getNodeFee()[1]);
  }

  getWalletActive(): boolean {
    return this.walletActive;
  }

  setWalletActive(state: boolean): void {
    this.walletActive = state;
  }

  getLastTxAmountRequested(): boolean {
    return this.lastTxAmountRequested;
  }

  setLastTxAmountRequested(amount: number): void {
    this.lastTxAmountRequested = amount;
  }

  evaluateLogLevel(logLevel: string): LogLevel {
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

  async sendTransaction(transaction: any): void {
    const { address, amount, paymentID } = transaction;

    const [hash, error] = await this.wallet.sendTransactionBasic(
      address,
      amount,
      paymentID
    );

    if (hash) {
      const response = { status: 'SUCCESS', hash, error };
      ipcRenderer.send('fromBackend', 'sendTransactionResponse', response);
    }
    if (error) {
      error.errorString = error.toString();
      const response = { status: 'FAILURE', hash, error };
      ipcRenderer.send('fromBackend', 'sendTransactionResponse', response);
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
  ): any[] {
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

  getTransactions(displayCount: number): void {
    this.setLastTxAmountRequested(displayCount);
    ipcRenderer.send(
      'fromBackend',
      'transactionList',
      this.getFormattedTransactions(0, displayCount, false)
    );
  }

  getBalance(): void {
    ipcRenderer.send('fromBackend', 'balance', this.wallet.getBalance());
  }

  saveWallet(notify: boolean) {
    if (!this.walletActive) {
      return;
    }

    const status = this.wallet.saveWalletToFile(
      this.walletFile,
      this.walletPassword
    );

    if (notify) {
      ipcRenderer.send('fromBackend', 'saveWalletResponse', status);
    }
  }

  async walletInit(wallet: any): Promise<void> {
    this.wallet = wallet;
    this.wallet.setLogLevel(this.evaluateLogLevel(this.logLevel));
    this.wallet.on(
      'heightchange',
      (walletBlockCount, localDaemonBlockCount, networkBlockCount) => {
        ipcRenderer.send('fromBackend', 'syncStatus', [
          walletBlockCount,
          localDaemonBlockCount,
          networkBlockCount
        ]);
      }
    );
    this.wallet.on('transaction', () => {
      this.getTransactions(this.getLastTxAmountRequested() + 1);
      this.getBalance();
    });
    await this.wallet.start();
    this.setWalletActive(true);
    this.getNodeFee();
    ipcRenderer.send('fromBackend', 'syncStatus', this.wallet.getSyncStatus());
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
    ipcRenderer.send('fromBackend', 'balance', this.wallet.getBalance());
    ipcRenderer.send('fromBackend', 'walletActiveStatus', true);
    ipcRenderer.send('fromBackend', 'authenticationStatus', true);
    console.log('wallet started.');
  }

  openWallet(password: string): void {
    this.walletPassword = password;
    const [openWallet, error] = WalletBackend.openWalletFromFile(
      this.daemon,
      this.walletFile,
      this.walletPassword
    );
    if (!error) {
      this.walletInit(openWallet);
    } else {
      ipcRenderer.send('fromBackend', 'authenticationStatus', false);
      console.log(error);
    }
  }
}
