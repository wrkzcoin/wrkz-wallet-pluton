// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import request from 'request-promise';
import log from 'electron-log';
import { DaemonConnection } from 'turtlecoin-wallet-backend';
import { config, eventEmitter } from '../index';
import { roundToNearestHundredth } from '../utils/utils';

export default class WalletSession {
  loginFailed: boolean;

  firstStartup: boolean = config.walletFile === '';

  firstLoadOnLogin: boolean;

  selectedFiat: string;

  fiatPrice: number;

  primaryAddress: string;

  transactions: any[] = [];

  syncStatus: number[] = [0, 0, 0];

  balance: number[] = [0, 0];

  nodeFee: number = 0;

  transactionCount: number = 0;

  daemonConnectionInfo: DaemonConnection = {
    daemonType: 1,
    daemonTypeDetermined: true,
    host: 'blockapi.turtlepay.io',
    port: 443,
    ssl: true,
    sslDetermined: true
  };

  preparedTransactionHash: string = '';

  constructor() {
    this.loginFailed = false;
    this.firstLoadOnLogin = true;
    this.selectedFiat = config.selectedFiat;
    this.fiatPrice = 0;
    this.getFiatPrice(this.selectedFiat);
  }

  setPreparedTransactionHash(hash: string): void {
    this.preparedTransactionHash = hash;
  }

  getPreparedTransactionHash(): string {
    return this.preparedTransactionHash;
  }

  getDaemonConnectionInfo(): any {
    return this.daemonConnectionInfo;
  }

  setDaemonConnectionInfo(daemonConnectionInfo: DaemonConnection): void {
    this.daemonConnectionInfo = daemonConnectionInfo;
    log.info(this.daemonConnectionInfo);
    eventEmitter.emit('gotDaemonConnectionInfo');
  }

  setNodeFee(fee: number): void {
    this.nodeFee = fee;
    eventEmitter.emit('gotNodeFee');
  }

  getNodeFee(): number {
    return this.nodeFee;
  }

  setBalance(balance: number[]): void {
    this.balance = balance;
    eventEmitter.emit('gotNewBalance');
  }

  getBalance(): number[] {
    return this.balance;
  }

  getUnlockedBalance(): number {
    return this.getBalance()[0];
  }

  getLockedBalance(): number {
    return this.getBalance()[1];
  }

  getTransactionCount(): number {
    return this.transactionCount;
  }

  setTransactionCount(txCount: number): void {
    this.transactionCount = txCount;
    eventEmitter.emit('gotTransactionCount');
  }

  getTransactions() {
    return this.transactions;
  }

  setTransactions(transactions: any[]) {
    this.transactions = transactions;
    eventEmitter.emit('gotNewTransactions');
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

  setSyncStatus(syncStatus: number[]) {
    this.syncStatus = syncStatus;
    eventEmitter.emit('gotSyncStatus');
  }

  getSyncStatus() {
    return this.syncStatus;
  }

  getSyncPercentage() {
    // thanks to zpalmtree for the original code
    const [walletHeight] = this.getSyncStatus();
    let [, , networkHeight] = this.getSyncStatus();
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

    return roundToNearestHundredth(percentSync);
  }

  getNetworkBlockHeight() {
    return this.syncStatus[2];
  }

  getLocalBlockHeight() {
    return this.syncStatus[1];
  }

  getWalletBlockHeight() {
    return this.syncStatus[0];
  }

  setPrimaryAddress(address: string) {
    this.primaryAddress = address;
  }

  getPrimaryAddress() {
    return this.primaryAddress;
  }
}
