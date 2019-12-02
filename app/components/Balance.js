// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import log from 'electron-log';
import ReactTooltip from 'react-tooltip';
import { session, il8n, eventEmitter, config } from '../index';
import Configure from '../Configure';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  unlockedBalance: number,
  lockedBalance: number,
  fiatPrice: number,
  displayCurrency: string,
  fiatSymbol: string,
  symbolLocation: string,
  fiatDecimals: number
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
      displayCurrency: config.displayCurrency,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals
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
      eventEmitter.on('transaction', this.refreshBalanceOnNewTransaction);
    }
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
  }

  componentWillUnmount() {
    if (session.wallet !== undefined) {
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
      eventEmitter.off('transaction', this.refreshBalanceOnNewTransaction);
    }
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
  }

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals
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
    if (displayCurrency === Configure.ticker) {
      this.setState({
        displayCurrency: 'fiat'
      });
      session.modifyConfig('displayCurrency', 'fiat');
      eventEmitter.emit('modifyCurrency', 'fiat');
    }
    if (displayCurrency === 'fiat') {
      this.setState({
        displayCurrency: Configure.ticker
      });
      session.modifyConfig('displayCurrency', Configure.ticker);
      eventEmitter.emit('modifyCurrency', Configure.ticker);
    }
    ReactTooltip.rebuild();
  };

  render() {
    const { darkMode, size } = this.props;
    const {
      unlockedBalance,
      lockedBalance,
      fiatPrice,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      fiatDecimals
    } = this.state;
    const color = darkMode ? 'is-dark' : 'is-white';

    let balanceTooltip;

    if (session.wallet && displayCurrency === Configure.ticker) {
      balanceTooltip =
        `Unlocked: ${session.atomicToHuman(unlockedBalance, true)} ${
          il8n.WRKZ
        }<br>` +
        `Locked: ${session.atomicToHuman(lockedBalance, true)} ${il8n.WRKZ}`;
    } else if (
      session.wallet &&
      symbolLocation === 'prefix' &&
      displayCurrency === 'fiat'
    ) {
      balanceTooltip =
        `Unlocked: ${fiatSymbol}${session.formatLikeCurrency(
          Number(
            fiatPrice * session.atomicToHuman(unlockedBalance, false)
          ).toFixed(fiatDecimals)
        )}
        <br>` +
        `Locked: ${fiatSymbol}${session.formatLikeCurrency(
          Number(
            fiatPrice * session.atomicToHuman(lockedBalance, false)
          ).toFixed(fiatDecimals)
        )}
        <br>`;
    } else if (
      session.wallet &&
      symbolLocation === 'suffix' &&
      displayCurrency === 'fiat'
    ) {
      balanceTooltip =
        `Unlocked: ${(
          fiatPrice * session.atomicToHuman(unlockedBalance, false)
        ).toFixed(fiatDecimals)}${fiatSymbol}
        <br>` +
        `Locked: ${(
          fiatPrice * session.atomicToHuman(lockedBalance, false)
        ).toFixed(fiatDecimals)}${fiatSymbol}`;
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
          {displayCurrency === Configure.ticker && (
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
              &nbsp;{il8n.WRKZ}
            </span>
          )}
          {displayCurrency === 'fiat' && symbolLocation === 'prefix' && (
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
              {fiatPrice !== 0 ? (
                // eslint-disable-next-line prefer-template
                fiatSymbol +
                session.formatLikeCurrency(
                  Number(
                    (
                      fiatPrice *
                      session.atomicToHuman(
                        unlockedBalance + lockedBalance,
                        false
                      )
                    ).toFixed(fiatDecimals)
                  )
                )
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
          {displayCurrency === 'fiat' && symbolLocation === 'suffix' && (
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
              {fiatPrice !== 0 ? (
                // eslint-disable-next-line prefer-template
                session.formatLikeCurrency(
                  Number(
                    (
                      fiatPrice *
                      session.atomicToHuman(
                        unlockedBalance + lockedBalance,
                        false
                      )
                    ).toFixed(fiatDecimals)
                  )
                ) + fiatSymbol
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
