// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
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
  }

  componentDidMount() {
    const { query } = this.props;
    this.getContactResults(query);
  }

  componentWillUnmount() {}

  getContactResults = (query: string) => {
    const possibleContactValues = ['name', 'address', 'paymentID'];
    let contactResults = possibleContactValues.map(value => {
      return this.search(query, addressList, value);
    });
    contactResults = this.filterNullValues(contactResults);
    this.setState({
      contactResults
    });
  };

  filterNullValues(arr: any[]) {
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
