// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import log from 'electron-log';
import ReactTooltip from 'react-tooltip';
import { session, il8n, eventEmitter, config } from '../index';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  unlockedBalance: number,
  lockedBalance: number,
  usdPrice: number,
  displayCurrency: string
};

export default class Balance extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      usdPrice: session.usdPrice,
      displayCurrency: config.displayCurrency
    };
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(
      this
    );
    this.updateFiatPrice = this.updateFiatPrice.bind(this);
    this.switchCurrency = this.switchCurrency.bind(this);
  }

  componentDidMount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(2);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
  }

  componentWillUnmount() {
    if (session.wallet !== undefined) {
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
  }

  updateFiatPrice = (usdPrice: number) => {
    this.setState({
      usdPrice
    });
  };

  refreshBalanceOnNewTransaction = () => {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
    ReactTooltip.rebuild();
  };

  switchCurrency = () => {
    const { displayCurrency } = this.state;
    if (displayCurrency === 'TRTL') {
      this.setState({
        displayCurrency: 'USD'
      });
      session.modifyConfig('displayCurrency', 'USD');
      eventEmitter.emit('modifyCurrency', 'USD');
    }
    if (displayCurrency === 'USD') {
      this.setState({
        displayCurrency: 'TRTL'
      });
      session.modifyConfig('displayCurrency', 'TRTL');
      eventEmitter.emit('modifyCurrency', 'TRTL');
    }
    ReactTooltip.rebuild();
  };

  render() {
    const { darkMode, size } = this.props;
    const {
      unlockedBalance,
      lockedBalance,
      usdPrice,
      displayCurrency
    } = this.state;
    const color = darkMode ? 'is-dark' : 'is-white';

    let balanceTooltip;

    if (session.wallet && displayCurrency === 'TRTL') {
      balanceTooltip =
        `Unlocked: ${session.atomicToHuman(unlockedBalance, true)} ${
          il8n.TRTL
        }<br>` +
        `Locked: ${session.atomicToHuman(lockedBalance, true)} ${il8n.TRTL}`;
    } else if (session.wallet && displayCurrency === 'USD') {
      balanceTooltip =
        `Unlocked: $${(
          usdPrice * session.atomicToHuman(unlockedBalance, false)
        ).toFixed(2)}
        <br>` +
        `Locked: $${(
          usdPrice * session.atomicToHuman(lockedBalance, false)
        ).toFixed(2)}`;
    } else {
      balanceTooltip = 'No wallet open!';
    }

    return (
      <div
        className="control statusicons"
        onClick={this.switchCurrency}
        onKeyPress={this.switchCurrency}
        role="button"
        tabIndex={0}
        onMouseDown={event => event.preventDefault()}
      >
        <div className="tags has-addons">
          <span className={`tag ${color} ${size}`}>{il8n.balance_colon}</span>
          {displayCurrency === 'TRTL' && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-warning ${size}`
                  : `tag is-info ${size}`
              }
              data-tip={balanceTooltip}
            >
              {lockedBalance > 0 ? (
                <i className="fa fa-lock" />
              ) : (
                <i className="fa fa-unlock" />
              )}
              &nbsp;
              {session.atomicToHuman(unlockedBalance + lockedBalance, true)}
              &nbsp;{il8n.TRTL}
            </span>
          )}
          {displayCurrency === 'USD' && (
            <span
              className={
                lockedBalance > 0
                  ? `tag is-warning ${size}`
                  : `tag is-info ${size}`
              }
              data-tip={balanceTooltip}
            >
              {lockedBalance > 0 ? (
                <i className="fa fa-lock" />
              ) : (
                <i className="fa fa-unlock" />
              )}
              &nbsp;
              {usdPrice !== 0 ? (
                // eslint-disable-next-line prefer-template
                '$' +
                (
                  usdPrice *
                  session.atomicToHuman(unlockedBalance + lockedBalance, false)
                ).toFixed(2)
              ) : (
                <ReactLoading
                  type="bubbles"
                  color="#F5F5F5"
                  height={30}
                  width={30}
                />
              )}
            </span>
          )}
        </div>
      </div>
    );
  }
}
