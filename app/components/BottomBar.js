// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import log from 'electron-log';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';

import SyncStatus from './SyncStatus';
import Balance from './Balance';

type Props = {};

type State = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  darkmode: boolean,
  nodeFee: number
};

export default class BottomBar extends Component<Props, State> {
  props: Props;

  syncInterval: IntervalID;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkmode: session.darkMode,
      nodeFee: session.daemon.feeAmount || 0
    };
    this.syncInterval = setInterval(() => this.refresh(), 1000);
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
    this.refreshNodeFee = this.refreshNodeFee.bind(this);
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(
      this
    );
  }

  componentDidMount() {
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(15);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
  }

  componentWillUnmount() {
    clearInterval(this.syncInterval);
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeoff', this.darkModeOff);
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(12);
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
  }

  darkModeOn = () => {
    this.setState({
      darkmode: true
    });
  };

  darkModeOff = () => {
    this.setState({
      darkmode: false
    });
  };

  refreshNodeFee = () => {
    this.setState({
      nodeFee: session.daemon.feeAmount
    });
  };

  refreshBalanceOnNewTransaction = () => {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  };

  refresh() {
    this.setState(() => ({
      syncStatus: session.getSyncStatus()
    }));
    ReactTooltip.rebuild();
  }

  render() {
    const {
      darkmode,
      unlockedBalance,
      lockedBalance,
      nodeFee,
      syncStatus
    } = this.state;
    const syncTooltip =
      session.wallet.getSyncStatus()[2] === 0
        ? 'Connecting, please wait...'
        : `${session.wallet.getSyncStatus()[0]}/${
            session.wallet.getSyncStatus()[2]
          }`;
    const balanceTooltip =
      `Unlocked: ${session.atomicToHuman(unlockedBalance, true)} ${
        session.wallet.config.ticker
      }<br>` +
      `Locked: ${session.atomicToHuman(lockedBalance, true)} ${
        session.wallet.config.ticker
      }`;

    return (
      // prettier-ignore
      <div
        className={
          // eslint-disable-next-line no-nested-ternary
          darkmode
            ? session.firstLoadOnLogin
              ? 'footerbar-slideup has-background-black'
              : 'footerbar has-background-black'
            : session.firstLoadOnLogin
              ? 'footerbar-slideup has-background-light'
              : 'footerbar has-background-light'
        }
      >
        {' '}
        <div className="field is-grouped is-grouped-multiline is-grouped-right">
          {nodeFee > 0 && (
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className={
                  darkmode
                    ? 'tag is-dark is-large'
                    : 'tag is-white is-large'}>Node Fee:</span>
                <span className="tag is-danger is-large">
                  {session.atomicToHuman(nodeFee, true)} {session.wallet.config.ticker}
                </span>
              </div>
            </div>
          )}
          <SyncStatus />
          <Balance />
        </div>
      </div>
    );
  }
}
