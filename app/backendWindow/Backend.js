// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { Daemon, WalletBackend, LogLevel } from 'turtlecoin-wallet-backend';
import { ipcRenderer } from 'electron';
import { createObjectCsvWriter } from 'csv-writer';
import log from 'electron-log';

export default class Backend {
  notifications: boolean;

  daemon: Daemon;

  daemonHost: string;

  daemonPort: number;

  walletFile: string;

  walletPassword: string = '';

  wallet: any;

  walletActive: boolean = false;

  lastTxAmountRequested: number = 50;

  constructor(config: any): Backend {
    this.notifications = config.notifications;
    this.daemonHost = config.daemonHost;
    this.daemonPort = config.daemonPort;
    this.walletFile = config.walletFile;
    this.logLevel = config.logLevel;
    this.daemon = new Daemon(this.daemonHost, this.daemonPort);
  }

  setNotifications(status: boolean) {
    this.notifications = status;
    log.info(this.notifications);
  }

  setDaemon(daemon: Daemon): void {
    this.daemon = daemon;
  }

  getDaemon(): Daemon {
    return this.daemon;
  }

  setWalletPassword(password: string): void {
    this.walletPassword = password;
  }

  getWalletPassword(): string {
    return this.walletPassword;
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

  exportToCSV(savePath: string) {
    const rawTransactions = this.getFormattedTransactions(
      undefined,
      undefined,
      false
    );
    const csvWriter = createObjectCsvWriter({
      path: savePath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'blockHeight', title: 'Block Height' },
        { id: 'transactionHash', title: 'Transaction Hash' },
        { id: 'pid', title: 'Payment ID' },
        { id: 'amount', title: 'Amount' },
        { id: 'bal', title: 'balance' }
      ]
    });
    const csvData = rawTransactions.map(item => {
      return {
        date: this.convertTimestamp(item[0]),
        blockHeight: item[4],
        transactionHash: item[1],
        pid: item[5],
        amount: this.atomicToHuman(item[2], true),
        bal: this.atomicToHuman(item[3], true)
      };
    });
    csvWriter.writeRecords(csvData);
  }

  setScanCoinbaseTransactions(value: boolean) {
    this.wallet.scanCoinbaseTransactions(value);
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

  changePassword(passwords: any): void {
    const { oldPassword, newPassword } = passwords;
    let response;
    if (this.getWalletPassword() !== oldPassword) {
      response = { status: 'FAILURE', error: 'AUTHERROR' };
    } else {
      this.setWalletPassword(newPassword);
      const saved = this.saveWallet(false);
      if (saved) {
        response = { status: 'SUCCESS', error: undefined };
      } else {
        response = { status: 'FAILURE', error: 'SAVEERROR' };
      }
    }
    ipcRenderer.send('fromBackend', 'passwordChangeResponse', response);
  }

  async rescanWallet(height: number) {
    await this.wallet.reset(height);
    this.saveWallet(false);
    ipcRenderer.send('fromBackend', 'rescanResponse', height);
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

  stop() {
    if (this.wallet) {
      this.wallet.stop();
    }
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

  saveWallet(notify: boolean, path?: string): boolean {
    if (!this.walletActive) {
      return;
    }

    const status = this.wallet.saveWalletToFile(
      path || this.walletFile,
      this.walletPassword
    );

    if (notify) {
      ipcRenderer.send('fromBackend', 'saveWalletResponse', status);
    }
    return status;
  }

  transactionSearch(query: string) {
    const transactions = this.wallet.getTransactions();
    const possibleTransactionValues = ['blockHeight', 'hash', 'paymentID'];
    const transactionResults = possibleTransactionValues.map(value => {
      return this.search(query, transactions, value);
    });
    let sanitizedResults = [];
    /* the search function returns a separate array of results for each
    value searched, we need to concat them together with spread */
    for (let i = 0; i < transactionResults.length; i++) {
      sanitizedResults = [...transactionResults[i], ...sanitizedResults];
    }
    ipcRenderer.send(
      'fromBackend',
      'transactionSearchResponse',
      sanitizedResults
    );
  }

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    const resultsToReturn = [];
    for (let i = 0; i < arrayToSearch.length; i++) {
      // will resolve to true if the selected value contains the substring, case insensitive
      if (
        String(arrayToSearch[i][objectPropertyName])
          .toUpperCase()
          .includes(searchedValue.toUpperCase())
      ) {
        /* we have to disable this because the function gets lost
        when we send the object over ipc */
        // eslint-disable-next-line no-param-reassign
        arrayToSearch[i].totalTxAmount = arrayToSearch[i].totalAmount();
        resultsToReturn.push(arrayToSearch[i]);
      }
    }
    return resultsToReturn;
  }

  async changeNode(nodeInfo: any): void {
    const { host, port } = nodeInfo;
    this.setDaemon(new Daemon(host, port));
    await this.wallet.swapNode(this.daemon);
    this.getConnectionInfo();
  }

  getConnectionInfo(): void {
    ipcRenderer.send(
      'fromBackend',
      'daemonConnectionInfo',
      this.wallet.getDaemonConnectionInfo()
    );
  }

  setLogLevel(logLevel: string): void {
    this.logLevel = logLevel;
    this.wallet.setLogLevel(this.evaluateLogLevel(this.logLevel));
  }

  async walletInit(wallet: any): Promise<void> {
    this.wallet = wallet;
    this.setLogLevel(this.logLevel);
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

    this.wallet.on('incomingtx', transaction => {
      if (this.notifications) {
        // eslint-disable-next-line no-new
        new window.Notification('Transaction Received!', {
          body: `You've just received ${this.atomicToHuman(
            transaction.totalAmount(),
            true
          )} TRTL.`
        });
      }
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
    ipcRenderer.send(
      'fromBackend',
      'daemonConnectionInfo',
      this.wallet.getDaemonConnectionInfo()
    );
    ipcRenderer.send('fromBackend', 'authenticationStatus', true);
  }

  getSecret(): string {
    const publicAddress = this.wallet.getPrimaryAddress();
    const [
      privateSpendKey,
      privateViewKey
    ] = this.wallet.getPrimaryAddressPrivateKeys();
    // eslint-disable-next-line prefer-const
    let [mnemonicSeed, err] = this.wallet.getMnemonicSeed();
    if (err) {
      if (err.errorCode === 41) {
        mnemonicSeed = '';
      } else {
        throw err;
      }
    }

    const secret =
      // eslint-disable-next-line prefer-template
      publicAddress +
      `\n\nPrivate Spend Key:\n\n` +
      privateSpendKey +
      `\n\nPrivate View Key:\n\n` +
      privateViewKey +
      (mnemonicSeed !== '' ? `\n\nMnemonic Seed:\n\n` : '') +
      mnemonicSeed +
      `\n\nPlease save these keys safely and securely. \nIf you lose your keys, you will not be able to recover your funds.`;

    return secret;
  }

  startWallet(password: string): void {
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
    }
  }

  atomicToHuman(x: number, prettyPrint?: boolean): number {
    if (prettyPrint || false) {
      return `${this.formatLikeCurrency((x / 100).toFixed(2))}`;
    }
    return x / 100;
  }

  humanToAtomic(x: number): number {
    return x * 100;
  }

  convertTimestamp(timestamp: Date): string {
    const d = new Date(timestamp * 1000); // Convert the passed timestamp to milliseconds
    const yyyy = d.getFullYear();
    const mm = `0${d.getMonth() + 1}`.slice(-2); // Months are zero based. Add leading 0.
    const dd = `0${d.getDate()}`.slice(-2); // Add leading 0.
    const hh = `0${d.getHours()}`.slice(-2);
    const min = `0${d.getMinutes()}`.slice(-2); // Add leading 0.
    // ie: 2013-02-18, 16:35
    const time = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    return time;
  }

  formatLikeCurrency(x: number): string {
    const parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
}
