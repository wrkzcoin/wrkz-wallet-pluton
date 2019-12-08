// Copyright (C) 2019 ExtraHash
// Copyright (C) 2019, WrkzCoin
//
// Please see the included LICENSE file for more information.
import request from 'request-promise';
import {
  WalletBackend,
  Daemon,
  LogLevel,
  Config
} from 'turtlecoin-wallet-backend';
import log from 'electron-log';
import fs, { WriteStream } from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { config, directories, eventEmitter, loginCounter } from '../index';
import { name, version } from '../../package.json';
import Configure from '../Configure';

export default class WalletSession {
  loginFailed: boolean;

  firstStartup: boolean;

  walletPassword: string;

  daemonHost: string;

  daemonPort: number;

  walletFile: string;

  darkMode: boolean;

  firstLoadOnLogin: boolean;

  selectedFiat: string;

  daemon: any;

  wallet: any;

  syncStatus: number;

  address: string;

  fiatPrice: number;

  backendLog: string[];

  logStream: WriteStream = fs.createWriteStream(
    `${directories[1]}/wallet-backend.log`,
    {
      flags: 'a'
    }
  );

  constructor(password?: string, daemonHost?: string, daemonPort?: string) {
    this.loginFailed = false;
    this.firstStartup = false;
    this.walletPassword = password || '';
    this.daemonHost = daemonHost || config.daemonHost;
    this.daemonPort =
      parseInt(daemonPort, 10) || parseInt(config.daemonPort, 10);
    this.walletFile = config.walletFile;
    this.darkMode = config.darkMode || false;
    this.firstLoadOnLogin = true;

    this.selectedFiat = config.selectedFiat;

    this.fiatPrice = 0;

    this.getFiatPrice(this.selectedFiat);

    this.updateNodeList();

    this.daemon = new Daemon(this.daemonHost, this.daemonPort);

    this.daemons = [];

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
        Configure
      );
    }

    if (error) {
      if (error.errorCode === 1) {
        this.walletFile = '';
        this.firstStartup = true;
      } else if (error.errorCode === 5) {
        this.loginFailed = true;
        if (loginCounter.loginsAttempted > 0) {
          loginCounter.lastLoginAttemptFailed = true;
        }
      } else {
        throw new Error(error);
      }
    }
    if (!this.loginFailed && !this.firstStartup) {
      this.loginFailed = false;
      loginCounter.isLoggedIn = true;
      log.debug(`Opened wallet file at ${this.walletFile}`);
      this.wallet = openWallet;
      this.syncStatus = this.getSyncStatus();
      this.address = this.wallet.getPrimaryAddress();

      this.backendLog = [];
      const logLevel = this.evaluateLogLevel(config.logLevel);
      this.wallet.setLogLevel(logLevel);
      this.wallet.setLoggerCallback(prettyMessage => {
        this.logStream.write(`${prettyMessage}\n`);
        this.backendLog.unshift(prettyMessage);
        if (this.backendLog.length > 1000) {
          this.backendLog.pop();
        }
        eventEmitter.emit('refreshBackendLog');
      });

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
      this.wallet.on('deadnode', () => {
        eventEmitter.emit('deadNode');
      });
      eventEmitter.on('scanCoinbaseTransactionsOn', () => {
        if (this.wallet) {
          this.wallet.scanCoinbaseTransactions(true);
        }
      });
      eventEmitter.on('scanCoinbaseTransactionsOff', () => {
        if (this.wallet) {
          this.wallet.scanCoinbaseTransactions(false);
        }
      });
    } else {
      this.address = '';
      this.syncStatus = 0;
    }
  }

  async startAutoSave() {
    await this.saveWallet(this.walletFile);
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

  toggleCloseToTray(status: boolean) {
    const programDirectory = directories[0];
    const modifyConfig = config;
    modifyConfig.closeToTray = status;
    log.debug(`Close to tray set to ${status.toString()}`);
    config.closeToTray = status;
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

  modifyConfig(propertyName: string, value: any) {
    const programDirectory = directories[0];
    log.debug(`Config update: ${propertyName} set to ${value.toString()}`);
    config[propertyName] = value;
    fs.writeFileSync(
      `${programDirectory}/config.json`,
      JSON.stringify(config, null, 4),
      err => {
        if (err) throw err;
        log.debug(err);
        return false;
      }
    );
  }

  exportToCSV(savePath: string) {
    const rawTransactions = this.getTransactions(undefined, undefined, false);
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

  handleImportFromSeed(seed: string, filePath: string, height?: number) {
    const [importedWallet, err] = WalletBackend.importWalletFromSeed(
      this.daemon,
      height,
      seed,
      Configure
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
      Configure
    );
    if (err) {
      log.debug(`Failed to load wallet: ${err.toString()}`);
      return false;
    }
    importedWallet.saveWalletToFile(savePath, '');
    log.debug('Wrote config file to disk.');
    return true;
  }

  handleNewWallet(wallet: any, filename: string, password: string) {
    const saved = wallet.saveWalletToFile(filename, password);
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
    includeFusions?: boolean
  ) {
    if (this.loginFailed || this.firstStartup) {
      return [];
    }

    const rawTransactions = this.wallet.getTransactions(
      startIndex,
      numTransactions,
      includeFusions || false
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
        index,
        tx.fee,
        tx.unlockTime
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

  getFiatPrice = async (fiat: string) => {
    const apiURL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${fiat}&ids=turtlecoin&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=7d`;

    const requestOptions = {
      method: 'GET',
      uri: apiURL,
      headers: {},
      json: true,
      gzip: true
    };
    try {
      const result = await request(requestOptions);
      this.fiatPrice = result[0].current_price;
      eventEmitter.emit('gotFiatPrice', result[0].current_price);
      return result[0].current_price;
    } catch (err) {
      log.debug(`Request failed, CoinGecko API call error: \n`, err);
      return undefined;
    }
  };

  updateNodeList = async () => {
    const apiURL = `${Configure.nodeListURL}`;

    const requestOptions = {
      method: 'GET',
      timeout: Configure.requestTimeout,
      uri: apiURL,
      headers: {},
      json: true,
      gzip: false
    };
    try {
      const result = await request(requestOptions);
      if (result.nodes) {
         const activeNodes = [];
         for (let i = 0; i < result.nodes.length; i++) {
            if (result.nodes[i].online === true) {
               activeNodes.push(
                  {
                     value: result.nodes[i].url + ':' + result.nodes[i].port.toString(),
                     label: result.nodes[i].url + ':' + result.nodes[i].port.toString()
                  });
            }
         }
         log.debug(
            `Get Total Online nodes: ${result.nodes.length}`
         );
         this.daemons = activeNodes;
      }
    } catch (err) {
      log.debug(`Failed to get node list from API: : \n`, err);
    }
  };

  getDaemonSyncStatus() {
    if (this.loginFailed || this.firstStartup) {
      return 0;
    }
    const [walletHeight, daemonHeight] = this.wallet.getSyncStatus();
    let [, , networkHeight] = this.wallet.getSyncStatus();
    /* Since we update the daemonHeight in intervals, and we update wallet
        height by syncing, occasionally wallet height is > network height.
        Fix that here. */
    if (
      daemonHeight > networkHeight &&
      networkHeight !== 0 &&
      networkHeight + 10 > daemonHeight
    ) {
      networkHeight = daemonHeight;
    }
    // Don't divide by zero
    const syncFill = networkHeight === 0 ? 0 : daemonHeight / networkHeight;
    let percentSync = 100 * syncFill;
    // Prevent 100% when just under
    if (percentSync > 99.99 && percentSync < 100) {
      percentSync = 99.99;
    }

    if (networkHeight - walletHeight === 1) {
      percentSync = 100.0;
    }

    return this.roundToNearestHundredth(percentSync);
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
    const syncFill = networkHeight === 0 ? 0 : walletHeight / networkHeight;
    let percentSync = 100 * syncFill;
    // Prevent 100% when just under
    if (percentSync > 99.99 && percentSync < 100) {
      percentSync = 99.99;
    }

    if (networkHeight - walletHeight === 1) {
      percentSync = 100.0;
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
    const payments = [];
    /* User payment */
    payments.push([sendToAddress, parseInt(amount, 10)]);

    const [hash, err] = await this.wallet.sendTransactionAdvanced(
      payments, undefined, undefined, 
      paymentID, undefined,
      undefined,
    );
    if (err) {
      log.debug(`Failed to send transaction: ${err.toString()}`);
      return [hash, err];
    }
    log.debug(`Transaction succeeded! ${hash}`);
    return [hash, err];
  }

  formatLikeCurrency(x: number) {
    const parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  atomicToHuman(x: number, prettyPrint?: boolean) {
    if (prettyPrint || false) {
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
