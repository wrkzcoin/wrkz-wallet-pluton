// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import { config, session } from '../index';
import currencies from '../constants/currencies.json';
import uiType from '../utils/uitype';

type Props = {
  darkMode: boolean
};

type State = {
  selectedFiat: string,
  active: boolean
};

export default class FiatSelector extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      selectedFiat: config.selectedFiat,
      active: false
    };

    this.toggleMenu = this.toggleMenu.bind(this);
    this.changeCurrency = this.changeCurrency.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  changeCurrency = (
    selectedFiat: string,
    fiatSymbol: string,
    symbolLocation: string,
    fiatDecimals: number
  ) => {
    log.debug(
      `User has selected ${selectedFiat} as alternate display currency.`
    );
    session.modifyConfig('selectedFiat', selectedFiat);
    session.modifyConfig('fiatSymbol', fiatSymbol);
    session.modifyConfig('symbolLocation', symbolLocation);
    session.modifyConfig('fiatDecimals', fiatDecimals);
    session.getFiatPrice(selectedFiat);
    this.setState({
      selectedFiat,
      active: false
    });
  };

  toggleMenu = () => {
    const { active } = this.state;
    this.setState({
      active: !active
    });
  };

  render() {
    const { darkMode } = this.props;
    const { selectedFiat, active } = this.state;
    const isActive = active ? 'is-active' : '';
    const { textColor } = uiType(darkMode);

    return (
      <div>
        <p className={`has-text-weight-bold ${textColor}`}>
          Alternate Display Currency:
        </p>
        <div className={`dropdown ${isActive}`}>
          <div
            className="dropdown-trigger"
            onClick={this.toggleMenu}
            onKeyPress={this.toggleMenu}
            role="button"
            tabIndex={0}
          >
            <button
              className="button"
              aria-haspopup="true"
              aria-controls="dropdown-menu3"
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
                    onClick={() =>
                      this.changeCurrency(
                        currency.ticker,
                        currency.symbol,
                        currency.symbolLocation,
                        currency.decimals
                      )
                    }
                    onKeyPress={this.changeCurrency}
                    role="button"
                    tabIndex={0}
                    key={currency.ticker}
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
      </div>
    );
  }
}
