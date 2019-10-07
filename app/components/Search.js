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
      darkMode: session.darkMode
    };
    this.addressList = addressList;
    this.transactions = session.wallet.getTransactions();
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    const { darkMode } = this.state;
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
            <div>
              <p className={textColor}>Contacts:</p>
              {JSON.stringify(this.addressList)}
            </div>
            <br />
            <div>
              <p className={textColor}>Transactions:</p>
              {JSON.stringify(this.transactions)}
            </div>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
