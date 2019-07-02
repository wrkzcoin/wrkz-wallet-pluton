// @flow
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect } from 'react-router-dom';
import request from 'request';
import { config, session } from '../index';
import navBar from './NavBar';
import { eventEmitter } from '../index';

let displayedTransactionCount = 50;

type Props = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>,
  history: any,
  importkey: boolean,
  importseed: boolean
};

export default class Home extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length,
      importkey: false,
      importseed: false,
      nodeFee: session.daemon.feeAmount,
      loginFailed: session.loginFailed
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', (evt, route) =>
      this.handleImportFromSeed(evt, route)
    );
    ipcRenderer.on('importKey', (evt, route) =>
      this.handleImportFromKey(evt, route)
    );
    if (session.wallet !== undefined) {
      session.wallet.on(
        'transaction',
        this.refreshListOnNewTransaction.bind(this)
      );
    }
    eventEmitter.on('openNewWallet', this.openNewWallet.bind(this));
    eventEmitter.on('gotNodeFee', this.refreshNodeFee.bind(this));
    eventEmitter.on('loginFailed', this.handleLoginFailure.bind(this));
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    eventEmitter.off('openNewWallet', this.openNewWallet.bind(this));
    eventEmitter.on('gotNodeFee', this.refreshNodeFee.bind(this));
    if (session.wallet !== undefined) {
      session.wallet.off(
        'transaction',
        this.refreshListOnNewTransaction.bind(this)
      );
    }
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
    });
  }

  refreshNodeFee() {
    this.setState({
      nodeFee: session.daemon.feeAmount
    });
  }

  refreshListOnNewTransaction() {
    log.debug('Transaction found, refreshing transaction list...');
    displayedTransactionCount++;
    this.setState({
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length
    });
  }

  openNewWallet() {
    log.debug('Initialized new wallet session, refreshing transaction list...');
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length,
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
    });
  }

  handleImportFromSeed(evt, route) {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    clearInterval(this.interval);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    this.setState({
      importkey: true
    });
  }

  handleLoadMore(evt, route) {
    evt.preventDefault();
    displayedTransactionCount += 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  }

  resetDefault(evt, route) {
    evt.preventDefault();
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
  }

  render() {
    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }

    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }

    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />
    }

    return (
      <div>
        {navBar('wallet')}
        <div className="maincontent has-background-light">
          <table className=" txlist table has-background-light is-striped is-hoverable is-fullwidth is-narrow is-family-monospace">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hash</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {this.state.transactions.map((tx, index) => {
                return (
                  <tr key={index}>
                    <td>
                      {tx[0] === 0 && (
                        <p className="has-text-danger">Unconfirmed</p>
                      )}
                      {tx[0] > 0 && <p>{session.convertTimestamp(tx[0])}</p>}
                    </td>
                    <td>{tx[1]}</td>
                    {tx[2] < 0 && (
                      <td>
                        <p className="has-text-danger is-negative-transaction">
                          {session.atomicToHuman(tx[2], true)}
                        </p>
                      </td>
                    )}
                    {tx[2] > 0 && (
                      <td>
                        <p>{session.atomicToHuman(tx[2], true)}</p>
                      </td>
                    )}
                    <td>
                      <p>{session.atomicToHuman(tx[3], true)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {this.state.transactions.length <
            this.state.totalTransactionCount && (
            <form>
              <div className="field">
                <div className="buttons">
                  <button
                    type="submit"
                    className="button is-warning"
                    onClick={this.handleLoadMore.bind(this)}
                  >
                    Load more...
                  </button>
                  <button
                    type="submit"
                    className="button is-danger"
                    onClick={this.resetDefault.bind(this)}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
        <div className="box has-background-grey-light footerbar">
          <div className="field is-grouped is-grouped-multiline is-grouped-right">
            {this.state.nodeFee > 0 && (
              <div className="control statusicons">
                <div className="tags has-addons">
                  <span className="tag is-dark is-large">Node Fee:</span>
                  <span className="tag is-danger is-large">
                    {session.atomicToHuman(this.state.nodeFee, true)} TRTL
                  </span>
                </div>
              </div>
            )}
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-dark is-large">Sync:</span>
                {this.state.syncStatus < 100 && (
                  <span className="tag is-warning is-large">
                    {this.state.syncStatus}%
                    <ReactLoading
                      type="bubbles"
                      color="#363636"
                      height={30}
                      width={30}
                    />
                  </span>
                )}
                {this.state.syncStatus === 100 && (
                  <span className="tag is-success is-large">
                    {this.state.syncStatus}%
                  </span>
                )}
              </div>
            </div>
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-dark is-large">Balance:</span>
                <span className="tag is-info is-large">
                  {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
