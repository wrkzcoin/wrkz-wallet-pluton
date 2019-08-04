// @flow
import { WalletBackend, Daemon, LogLevel } from 'turtlecoin-wallet-backend';
import log from 'electron-log';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { config, directories, eventEmitter } from '../index';

export default class WalletSession {
  loginFailed: boolean;

  firstStartup: boolean;

  walletPassword: string;

  daemonHost: string;

  daemonPort: number;

  walletFile: string;

  darkMode: boolean;

  firstLoadOnLogin: boolean;

  wbConfig: any;

  daemon: any;

  wallet: any;

  syncStatus: number;

  address: string;

  constructor(password: string, daemonHost: string, daemonPort: string) {
    this.loginFailed = false;
    this.firstStartup = false;
    this.walletPassword = password || '';
    this.daemonHost = daemonHost || config.daemonHost;
    this.daemonPort =
      parseInt(daemonPort, 10) || parseInt(config.daemonPort, 10);
    this.walletFile = config.walletFile;
    this.darkMode = config.darkMode || false;
    this.firstLoadOnLogin = true;
    /* put config for turtlecoin-wallet-backend/WalletBackend.ts here */
    this.wbConfig = {
      scanCoinbaseTransactions: config.scanCoinbaseTransactions
    };

    this.daemon = new Daemon(this.daemonHost, this.daemonPort);

    if (this.walletFile === '') {
      this.firstStartup = true;
      log.debug('Initial startup detected.');
    }

    let openWallet;
    let error;

    if (!this.firstStartup) {
      [openWallet, error] = WalletBackend.openWalletFromFile(
        this.daemon,
        this.walletFile,
        this.walletPassword,
        this.wbConfig
      );
    }

    if (error) {
      if (error.errorCode === 1) {
        this.walletFile = '';
        this.firstStartup = true;
      } else if (error.errorCode === 5) {
        this.loginFailed = true;
      }
    }
    if (!this.loginFailed && !this.firstStartup) {
      log.debug(`Opened wallet file at ${this.walletFile}`);
      this.wallet = openWallet;
      this.syncStatus = this.getSyncStatus();
      this.address = this.wallet.getPrimaryAddress();

      if (config.logLevel === 'DEBUG') {
        this.wallet.setLogLevel(LogLevel.DEBUG);
        this.wallet.setLoggerCallback(prettyMessage => {
          const logStream = fs.createWriteStream(
            `${directories[1]}/protonwallet.log`,
            {
              flags: 'a'
            }
          );
          logStream.write(`${prettyMessage}\n`);
        });
      }

      setInterval(() => this.startAutoSave(), 1000 * 60 * 5);

      this.wallet.on('sync', (walletHeight, networkHeight) => {
        log.debug(
          `Wallet synced! Wallet height: ${walletHeight}, Network height: ${networkHeight}`
        );
      });
      this.wallet.on('desync', (walletHeight, networkHeight) => {
        log.debug(
          `Wallet is no longer synced! Wallet height: ${walletHeight}, Network height: ${networkHeight}`
        );
      });
      this.wallet.on('incomingtx', transaction => {
        eventEmitter.emit(
          'sendNotification',
          this.atomicToHuman(transaction.totalAmount(), true)
        );
      });
    } else {
      this.address = '';
      this.syncStatus = 0;
    }
  }

  async startAutoSave() {
    await this.saveWallet(this.walletFile);
  }

  toggleDarkMode(status: boolean) {
    const programDirectory = directories[0];
    const modifyConfig = config;
    modifyConfig.darkMode = status;
    log.debug(`Dark mode changed to ${status.toString()}`);
    config.darkMode = status;
    fs.writeFileSync(
      `${programDirectory}/config.json`,
      JSON.stringify(config, null, 4),
      err => {
        if (err) throw err;
        log.debug(err);
        return false;
      }
    );
    log.debug('Wrote config file to disk.');
  }

  exportToCSV(savePath: string) {
    const rawTransactions = this.getTransactions(undefined, undefined, false);
    const csvWriter = createObjectCsvWriter({
      path: `${savePath}.csv`,
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

  handleImportFromSeed(seed: string, filePath: string, height?: number) {
    const [importedWallet, err] = WalletBackend.importWalletFromSeed(
      this.daemon,
      height,
      seed,
      this.wbConfig
    );
    if (err) {
      log.debug(`Failed to load wallet: ${err.toString()}`);
      return false;
    }
    importedWallet.saveWalletToFile(filePath, '');
    log.debug('Wrote config file to disk.');
    return true;
  }

  handleImportFromKey(
    viewKey: string,
    spendKey: string,
    savePath: string,
    height: number
  ) {
    const [importedWallet, err] = WalletBackend.importWalletFromKeys(
      this.daemon,
      height,
      viewKey,
      spendKey,
      this.wbConfig
    );
    if (err) {
      log.debug(`Failed to load wallet: ${err.toString()}`);
      return false;
    }
    importedWallet.saveWalletToFile(savePath, '');
    log.debug('Wrote config file to disk.');
    return true;
  }

  handleNewWallet(filename: string) {
    const newWallet = WalletBackend.createWallet(this.daemon, this.wbConfig);
    const saved = newWallet.saveWalletToFile(filename, '');
    if (!saved) {
      log.debug('Failed to save wallet!');
      return false;
    }
    return true;
  }

  readConfigFromDisk() {
    const programDirectory = directories[0];
    const rawUserConfig = fs.readFileSync(`${programDirectory}/config.json`);
    return JSON.parse(rawUserConfig.toString());
  }

  handleWalletOpen(selectedPath: string) {
    if (!this.firstStartup && this.wallet !== undefined) {
      this.wallet.stop();
    }
    const programDirectory = directories[0];
    const modifyConfig = config;
    modifyConfig.walletFile = selectedPath;
    log.debug(`Set new config filepath to: ${modifyConfig.walletFile}`);
    config.walletFile = selectedPath;
    fs.writeFileSync(
      `${programDirectory}/config.json`,
      JSON.stringify(config, null, 4),
      err => {
        if (err) throw err;
        log.debug(err);
        return false;
      }
    );
    log.debug('Wrote config file to disk.');

    return true;
  }

  async swapNode(daemonHost: string, daemonPort: string) {
    const saved = await this.saveWallet(this.walletFile);
    if (saved) {
      const programDirectory = directories[0];
      const modifyConfig = config;
      modifyConfig.daemonHost = daemonHost;
      modifyConfig.daemonPort = parseInt(daemonPort, 10);
      fs.writeFileSync(
        `${programDirectory}/config.json`,
        JSON.stringify(config, null, 4),
        err => {
          if (err) throw err;
          log.debug(err);
          return false;
        }
      );
      log.debug('Wrote config file to disk. Swapping daemon...');
      this.daemon = new Daemon(
        modifyConfig.daemonHost,
        modifyConfig.daemonPort
      );
      await this.wallet.swapNode(this.daemon);
      eventEmitter.emit('nodeChangeComplete');
      return true;
    }
    return false;
  }

  addAddress() {
    log.debug('Adding subwallet...');
  }

  getAddresses() {
    return this.wallet.getAddresses();
  }

  getTransactions(
    startIndex?: number,
    numTransactions?: number,
    includeFusions: boolean
  ) {
    if (this.loginFailed || this.firstStartup) {
      return [];
    }

    const rawTransactions = this.wallet.getTransactions(
      startIndex,
      numTransactions,
      includeFusions
    );
    const [unlockedBalance, lockedBalance] = this.wallet.getBalance();
    let balance = parseInt(unlockedBalance + lockedBalance, 10);
    const balances = [];

    for (const [index, tx] of rawTransactions.entries()) {
      balances.push([
        tx.timestamp,
        tx.hash,
        tx.totalAmount(),
        balance,
        tx.blockHeight,
        tx.paymentID,
        index
      ]);
      balance -= parseInt(tx.totalAmount(), 10);
    }
    return balances;
  }

  getUnlockedBalance(subwallets?: Array<string>) {
    if (this.loginFailed || this.firstStartup) {
      return 0;
    }
    const [unlockedBalance] = this.wallet.getBalance(subwallets);
    return unlockedBalance;
  }

  getLockedBalance(subwallets?: Array<string>) {
    if (this.loginFailed || this.firstStartup) {
      return 0;
    }
    const [, lockedBalance] = this.wallet.getBalance(subwallets);
    return lockedBalance;
  }

  getSyncStatus() {
    if (this.loginFailed || this.firstStartup) {
      return 0;
    }
    const [walletHeight] = this.wallet.getSyncStatus();
    let [, , networkHeight] = this.wallet.getSyncStatus();
    /* Since we update the network height in intervals, and we update wallet
        height by syncing, occasionally wallet height is > network height.
        Fix that here. */
    if (
      walletHeight > networkHeight &&
      networkHeight !== 0 &&
      networkHeight + 10 > walletHeight
    ) {
      networkHeight = walletHeight;
    }
    /* if the wallet has been synced in the past, the wallet will sometimes display
        currentHeight / 0, so if networkHeight is 0 set it equal to block height */
    if (networkHeight === 0 && walletHeight !== 0) {
      networkHeight = walletHeight;
    }
    // Don't divide by zero
    let syncFill = networkHeight === 0 ? 0 : walletHeight / networkHeight;
    let percentSync = 100 * syncFill;
    // Prevent bar looking full when it's not
    if (syncFill > 0.97 && syncFill < 1) {
      syncFill = 0.97;
    }
    // Prevent 100% when just under
    if (percentSync > 99.99 && percentSync < 100) {
      percentSync = 99.99;
    }
    return this.roundToNearestHundredth(percentSync);
  }

  saveWallet(filePath?: string) {
    if (filePath !== undefined) {
      if (this.firstStartup !== true && this.wallet !== undefined) {
        const saved = this.wallet.saveWalletToFile(
          `${filePath}`,
          this.walletPassword
        );
        if (!saved) {
          log.debug('Failed to save wallet.');
          return false;
        }
        if (saved) {
          log.debug(`Wallet saved at ${filePath}`);
          return true;
        }
      } else {
        log.debug('No path provided, or no wallet initialized');
        return false;
      }
    }
  }

  async sendTransaction(
    sendToAddress: string,
    amount: number,
    paymentID: string
  ) {
    log.debug(
      `Sending transaction: Amount: ${amount} Address ${sendToAddress} PID: ${paymentID}`
    );
    const [hash, err] = await this.wallet.sendTransactionBasic(
      sendToAddress,
      parseInt(amount, 10),
      paymentID
    );
    if (err) {
      log.debug(`Failed to send transaction: ${err.toString()}`);
      return [hash, err];
    }
    log.debug(`Transaction succeeded! ${hash}`);
    return [hash, err];
  }

  formatLikeCurrency(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  atomicToHuman(x: number, prettyPrint: boolean) {
    if (prettyPrint) {
      // $FlowFixMe
      return `${this.formatLikeCurrency((x / 100).toFixed(2))}`;
    }
    return x / 100;
  }

  humanToAtomic(x: number) {
    return x * 100;
  }

  convertTimestamp(timestamp: Date) {
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

  roundToNearestHundredth(x: number) {
    return Math.ceil(x * 100) / 100;
  }
}
