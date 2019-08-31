// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
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
  fiatPrice: number,
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
      fiatPrice: session.fiatPrice,
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

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice
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
        displayCurrency: 'fiat'
      });
      session.modifyConfig('displayCurrency', 'fiat');
      eventEmitter.emit('modifyCurrency', 'fiat');
    }
    if (displayCurrency === 'fiat') {
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
      fiatPrice,
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
    } else if (session.wallet && displayCurrency === 'fiat') {
      balanceTooltip =
        `Unlocked: $${(
          fiatPrice * session.atomicToHuman(unlockedBalance, false)
        ).toFixed(2)}
        <br>` +
        `Locked: $${(
          fiatPrice * session.atomicToHuman(lockedBalance, false)
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
          {displayCurrency === 'fiat' && (
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
              &nbsp; $
              {(
                fiatPrice *
                session.atomicToHuman(unlockedBalance + lockedBalance, false)
              ).toFixed(2)}
              &nbsp;{il8n.TRTL}
            </span>
          )}
        </div>
      </div>
    );
  }
}
