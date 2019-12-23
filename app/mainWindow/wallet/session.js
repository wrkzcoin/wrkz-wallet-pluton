// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import request from 'request-promise';
import log from 'electron-log';
import fs from 'fs';
import { config, directories, eventEmitter } from '../index';

export default class WalletSession {
  loginFailed: boolean;

  firstStartup: boolean;

  darkMode: boolean;

  firstLoadOnLogin: boolean;

  selectedFiat: string;

  fiatPrice: number;

  primaryAddress: string;

  transactions: any[] = [];

  constructor() {
    this.loginFailed = false;
    this.firstStartup = false;
    this.darkMode = config.darkMode || false;
    this.firstLoadOnLogin = true;
    this.selectedFiat = config.selectedFiat;
    this.fiatPrice = 0;
    this.getFiatPrice(this.selectedFiat);
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

  readConfigFromDisk() {
    const programDirectory = directories[0];
    const rawUserConfig = fs.readFileSync(`${programDirectory}/config.json`);
    return JSON.parse(rawUserConfig.toString());
  }

  getTransactions() {
    return this.transactions;
  }

  setTransactions(transactions: any[]) {
    this.transactions = transactions;
  }

  getUnlockedBalance() {
    return 0;
  }

  getLockedBalance() {
    return 0;
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

  getDaemonSyncStatus() {
    return 0;
  }

  getSyncStatus() {
    return 0;
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

  setPrimaryAddress(address: string) {
    this.primaryAddress = address;
  }

  getPrimaryAddress() {
    return this.primaryAddress;
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
