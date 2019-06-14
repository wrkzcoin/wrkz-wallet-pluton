/* eslint-disable class-methods-use-this */
import {
  WalletBackend,
  BlockchainCacheApi,
  ConventionalDaemon
} from 'turtlecoin-wallet-backend';
import log from 'electron-log';
import fs from 'fs';
import { config } from '../reducers/index';

export default class WalletSession {
  constructor(opts) {
    // this.daemon = new ConventionalDaemon('nodes.hashvault.pro', true);
    this.daemon = new BlockchainCacheApi('blockapi.turtlepay.io', true);
    let [openWallet, error] = WalletBackend.openWalletFromFile(
      this.daemon,
      config.walletFile,
      ''
    );
    if (error) {
      if (error.errorCode === 1) {
        log.debug("Didn't find default wallet file, creating...");
        openWallet = WalletBackend.createWallet(this.daemon);
      }
    }
    log.debug(`Opened wallet file at ${config.walletFile}`);
    this.wallet = openWallet;
    this.wallet.start();
    this.syncStatus = this.getSyncStatus();
    this.address = this.wallet.getPrimaryAddress();

    this.wallet.on('transaction', transaction => {
      log.debug(`Transaction of ${transaction.totalAmount()} received!`);
    });

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
  }

  handleWalletOpen(selectedPath) {
    // this.wallet.stop();
    log.debug(selectedPath);
    log.debug(config);
    let modifyConfig = config
    modifyConfig.walletFile = selectedPath
    log.debug('modified config:\n' + JSON.stringify(modifyConfig, null, 4));
  }

  addAddress() {
    log.debug('Adding subwallet...');
  }

  getAddresses() {
    return this.wallet.getAddresses();
  }

  getTransactions() {
    const rawTransactions = this.wallet.getTransactions();
    const formattedTransactions = rawTransactions.map(tx => [
      tx.timestamp,
      tx.hash,
      tx.totalAmount()
    ]);
    return formattedTransactions;
  }

  getUnlockedBalance(subwallets?: Array<string>) {
    const [unlockedBalance, lockedBalance] = this.wallet.getBalance(subwallets);
    return unlockedBalance;
  }

  getLockedBalance(subwallets?: Array<string>) {
    const [unlockedBalance, lockedBalance] = this.wallet.getBalance(subwallets);
    return lockedBalance;
  }

  getSyncStatus() {
    let [
      walletHeight,
      localHeight,
      networkHeight
    ] = this.wallet.getSyncStatus();
    /* Since we update the network height in intervals, and we update wallet
        height by syncing, occasionaly wallet height is > network height.
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
      this.wallet.saveWalletToFile(`${filePath}`, '');
      log.debug(`Wallet copy saved at ${filePath}`);
    } else {
      log.debug('No path provided!');
      return;
    }
  }

  async sendTransaction(
    sendToAddress: string,
    amount: number,
    paymentID: string,
    fee: number
  ) {
    log.debug(
      `** Sending transaction: Amount: ${amount} Address ${sendToAddress} PID: ${paymentID} Fee ${fee}...`
    );
    const [hash, err] = await this.wallet.sendTransactionBasic(
      sendToAddress,
      parseInt(amount, 10),
      paymentID
    );
    if (err) {
      log.debug(`Failed to send transaction: ${err.toString()}`);
      return err;
    }
    log.debug(`Transaction succeeded! ${hash}`);
    return hash;
  }

  formatLikeCurrency(x: Number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  atomicToHuman(x: number, prettyPrint: boolean) {
    if (prettyPrint) {
      return `${this.formatLikeCurrency((x / 100).toFixed(2))}`;
    }
    return x / 100;
  }

  convertTimestamp(timestamp: Date) {
    let d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
      yyyy = d.getFullYear(),
      mm = `0${d.getMonth() + 1}`.slice(-2), // Months are zero based. Add leading 0.
      dd = `0${d.getDate()}`.slice(-2), // Add leading 0.
      hh = `0${d.getHours()}`.slice(-2),
      min = `0${d.getMinutes()}`.slice(-2), // Add leading 0.
      time;
    // ie: 2013-02-18, 16:35
    time = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    return time;
  }

  roundToNearestHundredth(x: number) {
    return Math.ceil(x * 100) / 100;
  }
}
