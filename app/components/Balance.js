// @flow
import React, { Component } from 'react';
import log from 'electron-log';
import ReactTooltip from 'react-tooltip';
import { session, il8n, eventEmitter } from '../index';

type Props = {};

type State = {
  unlockedBalance: number,
  lockedBalance: number,
  darkMode: boolean
};

export default class Balance extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      darkMode: session.darkMode
    };
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(
      this
    );
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentDidMount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(2);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
  }

  componentWillUnmount() {
    if (session.wallet !== undefined) {
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeoff', this.darkModeOff);
  }

  refreshBalanceOnNewTransaction = () => {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
    ReactTooltip.rebuild();
  };

  darkModeOn = () => {
    this.setState({
      darkMode: true
    });
  }

  darkModeOff = () => {
    this.setState({
      darkMode: false
    });
  }

  render() {
    const { darkMode, unlockedBalance, lockedBalance } = this.state;

    let balanceTooltip;

    if (session.wallet) {
      balanceTooltip =
        `Unlocked: ${session.atomicToHuman(unlockedBalance, true)} ${
          session.wallet.config.ticker
        }<br>` +
        `Locked: ${session.atomicToHuman(lockedBalance, true)} ${
          session.wallet.config.ticker
        }`;
    } else {
      balanceTooltip = 'No wallet open!';
    }

    return (
      // prettier-ignore
      <div className="control statusicons">
        <div className="tags has-addons">
          <span className={
            darkMode
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
            &nbsp;TRTL
          </span>
        </div>
      </div>
    );
  }
}
