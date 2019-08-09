// @flow
import React, { Component } from 'react';
import log from 'electron-log';
import ReactTooltip from 'react-tooltip';
import { session, il8n } from '../index';

type Props = {};

type State = {
  unlockedBalance: number,
  lockedBalance: number,
  darkmode: boolean
};

export default class Balance extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      darkmode: session.darkMode
    };
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(
      this
    );
  }

  componentDidMount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(2);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
  }

  componentWillUnmount() {
    if (session.wallet !== undefined) {
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
  }

  refreshBalanceOnNewTransaction = () => {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
    ReactTooltip.rebuild();
  };

  render() {
    const { darkmode, unlockedBalance, lockedBalance } = this.state;

    const balanceTooltip =
      `Unlocked: ${session.atomicToHuman(unlockedBalance, true)} ${
        session.wallet.config.ticker
      }<br>` +
      `Locked: ${session.atomicToHuman(lockedBalance, true)} ${
        session.wallet.config.ticker
      }`;

    return (
      // prettier-ignore
      <div className="control statusicons">
        <div className="tags has-addons">
          <span className={
            darkmode
              ? 'tag is-dark is-large'
              : 'tag is-white is-large'}>{il8n.balance_colon}</span>
          <span
            className={
              lockedBalance > 0
                ? 'tag is-warning is-large'
                : 'tag is-info is-large'
            }
            data-tip={balanceTooltip}
          >
            {lockedBalance > 0 ? (
              <i className="fa fa-lock" />
            ) : (
              <i className="fa fa-unlock" />
            )}
            &nbsp;
            {session.atomicToHuman(
              unlockedBalance + lockedBalance,
              true
            )}
            &nbsp;{session.wallet.config.ticker}
          </span>
        </div>
      </div>
    );
  }
}
