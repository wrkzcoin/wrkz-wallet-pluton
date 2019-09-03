// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import { config } from '../index';
import currencies from '../constants/currencies.json';

type Props = {};

type State = {
  selectedFiat: string
};

export default class FiatSelector extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      selectedFiat: config.selectedFiat
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  changeCurrency() {
    log.debug('works');
  }

  render() {
    const { selectedFiat } = this.state;

    return (
      <div className="dropdown is-hoverable">
        <div className="dropdown-trigger">
          <button
            className="button"
            aria-haspopup="true"
            aria-controls="dropdown-menu4"
          >
            <span>{selectedFiat.toUpperCase()}</span>
            <span className="icon is-small">
              <i className="fas fa-angle-down" aria-hidden="true" />
            </span>
          </button>
        </div>
        <div className="dropdown-menu" id="dropdown-menu4" role="menu">
          <div className="dropdown-content">
            {currencies.map(currency => {
              return (
                <div
                  className="dropdown-item"
                  onClick={this.changeCurrency}
                  onKeyPress={this.changeCurrency}
                  role="button"
                  tabIndex={0}
                >
                  <div className="columns">
                    <div className="column">
                      {currency.ticker.toUpperCase()}
                    </div>
                    <div className="column">{currency.symbol}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
