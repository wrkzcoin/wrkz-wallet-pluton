// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import { config, session } from '../index';
import currencies from '../constants/currencies.json';

type Props = {};

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

  changeCurrency = (selectedFiat: string) => {
    log.debug(
      `User has selected ${selectedFiat} as alternate display currency.`
    );
    session.modifyConfig('selectedFiat', selectedFiat);
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
    const { selectedFiat, active } = this.state;
    const isActive = active ? 'is-active' : '';

    return (
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
                  onClick={() => this.changeCurrency(currency.ticker)}
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
