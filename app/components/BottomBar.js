import React, { Component } from 'react';
import { session, eventEmitter } from '../index';
import ReactLoading from 'react-loading';
import log from 'electron-log';
import ReactTooltip from 'react-tooltip';

export default class BottomBar extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      darkmode: session.darkMode,
      nodeFee: session.daemon.feeAmount || 0,
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
    this.refreshNodeFee = this.refreshNodeFee.bind(this);
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(2);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeoff', this.darkModeOff);
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
  }

  darkModeOn() {
    this.setState({
      darkmode: true
    });
  }

  darkModeOff() {
    this.setState({
      darkmode: false
    });
  }

  refreshNodeFee() {
    this.setState({
      nodeFee: session.daemon.feeAmount
    });
  }

  refreshBalanceOnNewTransaction() {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
    ReactTooltip.rebuild();
  }

  render() {
    const syncTooltip =
      session.wallet.getSyncStatus()[2] === 0
        ? 'Connecting, please wait...'
        : `${session.wallet.getSyncStatus()[0]}/${
            session.wallet.getSyncStatus()[2]
          }`;
    const balanceTooltip =
      `Unlocked: ${session.atomicToHuman(
        this.state.unlockedBalance,
        true
      )} ${session.wallet.config.ticker}<br>` +
      `Locked: ${session.atomicToHuman(this.state.lockedBalance, true)} ${session.wallet.config.ticker}`;

    return (
      // prettier-ignore
      <div
        className={
          this.state.darkmode
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
          {this.state.nodeFee > 0 && (
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className={
                  this.state.darkmode
                    ? 'tag is-dark is-large'
                    : 'tag is-white is-large'}>Node Fee:</span>
                <span className="tag is-danger is-large">
                  {session.atomicToHuman(this.state.nodeFee, true)} {session.wallet.config.ticker}
                </span>
              </div>
            </div>
          )}
          <div className="control statusicons">
            <div className="tags has-addons">
              <span className={
                this.state.darkmode
                  ? 'tag is-dark is-large'
                  : 'tag is-white is-large'}>Sync:</span>
              {this.state.syncStatus < 100 &&
                session.daemon.networkBlockCount !== 0 && (
                  <span
                    className="tag is-warning is-large sync-status"
                    data-tip={syncTooltip}
                  >
                    {this.state.syncStatus}%
                    <ReactLoading
                      type="bubbles"
                      color="#363636"
                      height={30}
                      width={30}
                    />
                  </span>
                )}
              {this.state.syncStatus === 100 &&
                session.daemon.networkBlockCount !== 0 && (
                  <span
                    className="tag is-success is-large sync-status"
                    data-tip={syncTooltip}
                  >
                    {this.state.syncStatus}%
                  </span>
                )}
              {session.daemon.networkBlockCount === 0 && (
                <span className="tag is-danger is-large sync-status" data-tip={syncTooltip}>
                  <ReactLoading
                    type="spinningBubbles"
                    color="#F5F5F5"
                    height={30}
                    width={30}
                  />
                </span>
              )}
            </div>
          </div>
          <div className="control statusicons">
            <div className="tags has-addons">
              <span className={
                this.state.darkmode
                  ? 'tag is-dark is-large'
                  : 'tag is-white is-large'}>Balance:</span>
              <span
                className={
                  this.state.lockedBalance > 0
                    ? 'tag is-warning is-large'
                    : 'tag is-info is-large'
                }
                data-tip={balanceTooltip}
              >
                {this.state.lockedBalance > 0 ? (
                  <i className="fa fa-lock" />
                ) : (
                  <i className="fa fa-unlock" />
                )}
                &nbsp;
                {session.atomicToHuman(
                  this.state.unlockedBalance + this.state.lockedBalance,
                  true
                )}
                &nbsp;{session.wallet.config.ticker}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
