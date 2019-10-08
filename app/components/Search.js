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
  darkMode: boolean,
  contactResults: string[],
  transactionResults: any[]
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
    this.getContactResults = this.getContactResults.bind(this);
    this.getTransactionResults = this.getTransactionResults.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;
    this.getContactResults(query);
    this.getTransactionResults(query);
    this.setState({
      query
    });
  }

  componentWillReceiveProps(newProps) {
    const { query } = newProps;
    this.getContactResults(query);
    this.setState({
      query
    });
  }

  componentWillUnmount() {}

  getContactResults = (query: string) => {
    const possibleContactValues = ['name', 'address', 'paymentID'];

    const contactResults = possibleContactValues.map(value => {
      return this.search(query, addressList, value);
    });

    let sanitizedResults = [];

    /* the search function returns a separate array of results for each
       value searched, we need to concat them together with spread */
    for (let i = 0; i < contactResults.length; i++) {
      sanitizedResults = [...contactResults[i], ...sanitizedResults];
    }

    /* We don't want duplicates, so we're going to
       pass the array to a new Set to remove them */
    sanitizedResults = [...new Set(this.filterNullValues(sanitizedResults))];

    this.setState({
      contactResults: sanitizedResults
    });
  };

  getTransactionResults = (query: string) => {
    const transactions = session.wallet.getTransactions();
    log.debug(query);
    log.debug(transactions);
  };

  filterNullValues(arr: any[]) {
    return arr.filter(Boolean);
  }

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    const resultsToReturn = [];
    for (let i = 0; i < arrayToSearch.length; i++) {
      // will resolve to true if the selected value contains the substring, case insensitive
      if (
        arrayToSearch[i][objectPropertyName]
          .toUpperCase()
          .includes(searchedValue.toUpperCase())
      ) {
        // return
        resultsToReturn.push(arrayToSearch[i]);
      }
    }
    return resultsToReturn;
  }

  render() {
    const { darkMode, contactResults } = this.state;
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
              <br />
              <br />
              {JSON.stringify(contactResults)}
            </p>
            <br />
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
