// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { session, eventEmitter, config } from '../index';
import uiType from '../utils/uitype';

type State = {
  scanCoinbaseTransactions: boolean
};

type Props = {
  darkMode: boolean
};

export default class ScanCoinbaseToggle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      scanCoinbaseTransactions: config.scanCoinbaseTransactions || false
    };
    this.scanCoinbaseTransactionsOn = this.scanCoinbaseTransactionsOn.bind(
      this
    );
    this.scanCoinbaseTransactionsOff = this.scanCoinbaseTransactionsOff.bind(
      this
    );
  }

  componentWillMount() {}

  componentWillUnmount() {}

  scanCoinbaseTransactionsOn = () => {
    session.modifyConfig('scanCoinbaseTransactions', true);
    this.setState({
      scanCoinbaseTransactions: true
    });
    eventEmitter.emit('scanCoinbaseTransactionsOn');
  };

  scanCoinbaseTransactionsOff = () => {
    session.modifyConfig('scanCoinbaseTransactions', false);
    this.setState({
      scanCoinbaseTransactions: false
    });
    eventEmitter.emit('scanCoinbaseTransactionsOff');
  };

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { scanCoinbaseTransactions } = this.state;
    return (
      <div>
        {scanCoinbaseTransactions === false && (
          <span className={textColor}>
            <a
              className="button is-danger"
              onClick={this.scanCoinbaseTransactionsOn}
              onKeyPress={this.scanCoinbaseTransactionsOn}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fas fa-times" />
              </span>
            </a>
            &nbsp;&nbsp; Scan Coinbase Transactions: <b>Off</b>
          </span>
        )}
        {scanCoinbaseTransactions === true && (
          <span className={textColor}>
            <a
              className="button is-success"
              onClick={this.scanCoinbaseTransactionsOff}
              onKeyPress={this.scanCoinbaseTransactionsOff}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fa fa-check" />
              </span>
            </a>
            &nbsp;&nbsp; Scan Coinbase Transactions: <b>On</b> &nbsp;&nbsp;
          </span>
        )}
      </div>
    );
  }
}
