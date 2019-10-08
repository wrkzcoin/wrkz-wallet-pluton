// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';
import { session, addressList } from '../index';

type Props = {
  query: string
};

type States = {
  darkMode: boolean
};

export default class Search extends Component<Props, States> {
  props: Props;

  states: States;

  addressList: any[];

  transactions: any[];

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      contactResults: [],
      transactionResults: []
    };
    this.addressList = addressList;
    this.transactions = session.wallet.getTransactions();
    this.searchHistory = [];
  }

  componentDidMount() {
    const { query } = this.props;
    this.getSearchResults(query);
  }

  componentDidUpdate() {
    const { query } = this.props;

    this.getSearchResults(query);
  }

  componentWillUnmount() {}

  async getSearchResults(query: string) {
    const contactMatches = await this.getContactResults(query);
    const transactionMatches = await this.getTransactionResults(query);
  }

  async getContactResults(query: string) {
    const possibleContactValues = ['name', 'address', 'paymentID'];
    let contactResults = await possibleContactValues.map(value => {
      return this.search(query, addressList, value);
    });
    contactResults = this.filterNullValues(contactResults);
    log.debug(contactResults);
    return contactResults;
  }

  async getTransactionResults(query: string) {
    log.debug(query);
  }

  filterNullValues(arr) {
    return arr.filter(Boolean);
  }

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    for (let i = 0; i < arrayToSearch.length; i++) {
      // will resolve to true if the selected value contains the substring, case insensitive
      if (
        arrayToSearch[i][objectPropertyName]
          .toUpperCase()
          .includes(searchedValue.toUpperCase())
      ) {
        return arrayToSearch[i];
      }
    }
  }

  render() {
    const { darkMode, contactResults, transactionResults } = this.state;
    const { query } = this.props;
    const { backgroundColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <NavBar darkMode={darkMode} query={query} />
          <div className={`maincontent ${backgroundColor}`}>
            <p className={`${textColor} subtitle`}>
              Search results for <b>{query}:</b>
            </p>
            {contactResults.length > 0 && (
              <div>
                <p className={textColor}>
                  Contacts:
                  <br />
                  {JSON.stringify(this.contactResults)}
                </p>
              </div>
            )}
            <br />
            <div>
              <p className={textColor}>
                Transactions:
                <br />
                {JSON.stringify(this.transactions)}
              </p>
            </div>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
