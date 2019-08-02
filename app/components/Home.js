// @flow
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { session, loginCounter, eventEmitter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length,
      loginFailed: session.loginFailed,
      firstStartup: session.firstStartup,
      darkmode: session.darkMode
    };

    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
      this
    );
    this.openNewWallet = this.openNewWallet.bind(this);
  }

  componentDidMount() {
    ipcRenderer.setMaxListeners(1);
    if (session.wallet !== undefined) {
      session.wallet.on('transaction', this.refreshListOnNewTransaction);
    }
    eventEmitter.on('openNewWallet', this.openNewWallet);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    if (session.firstLoadOnLogin && this.state.loginFailed === false) {
      this.switchOffAnimation();
    }
    if (!this.state.loginFailed) {
      loginCounter.userLoginAttempted = false;
    }
  }

  componentWillUnmount() {
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
    eventEmitter.off('openNewWallet', this.openNewWallet);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    if (session.wallet !== undefined) {
      session.wallet.off('transaction', this.refreshListOnNewTransaction);
    }
  }

  async switchOffAnimation() {
    await sleep(1000);
    session.firstLoadOnLogin = false;
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
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
      totalTransactionCount: session.getTransactions().length,
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
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
      lockedBalance: session.getLockedBalance()
    });
  }

  handleLoadMore(evt, route) {
    evt.preventDefault();
    displayedTransactionCount += 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  }

  handleShowAll(evt, route) {
    evt.preventDefault();
    displayedTransactionCount = this.state.totalTransactionCount;
    this.setState({
      transactions: session.getTransactions(
        0,
        this.state.totalTransactionCount,
        false
      )
    });
  }

  resetDefault(evt, route) {
    evt.preventDefault();
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  }

  render() {
    if (this.state.firstStartup === true) {
      return <Redirect to="/firststartup" />;
    }

    if (this.state.changePassword === true) {
      return <Redirect to="/changepassword" />;
    }

    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }

    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }

    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }

    return (
      <div>
        <Redirector />
        {this.state.darkmode === false && (
          <div className="wholescreen">
            <ReactTooltip
              effect="solid"
              border
              type="dark"
              multiline
              place="top"
            />
            <NavBar />
            <div
              className={
                session.firstLoadOnLogin
                  ? 'maincontent-homescreen-fadein'
                  : 'maincontent-homescreen'
              }
            >
              <table className="table is-striped is-hoverable is-fullwidth is-family-monospace">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hash</th>
                    <th className="has-text-right">Amount</th>
                    <th className="has-text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.transactions.map((tx, index) => {
                    return (
                      <tr key={index}>
                        <td
                          data-tip={
                            tx[0] === 0
                              ? 'This transaction is unconfirmed. Should be confirmed within 30 seconds!'
                              : `Block ${tx[4]}`
                          }
                        >
                          {tx[0] === 0 && (
                            <p className="has-text-danger">Unconfirmed</p>
                          )}
                          {tx[0] > 0 && (
                            <p>{session.convertTimestamp(tx[0])}</p>
                          )}
                        </td>
                        <td>{tx[1]}</td>
                        {tx[2] < 0 && (
                          <td>
                            <p className="has-text-danger has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        {tx[2] > 0 && (
                          <td>
                            <p className="has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        <td>
                          <p className="has-text-right">
                            {session.atomicToHuman(tx[3], true)}
                          </p>
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
                        className="button is-success"
                        onClick={this.handleShowAll.bind(this)}
                      >
                        Show all
                      </button>
                      <button
                        type="submit"
                        className="button is-warning"
                        onClick={this.handleLoadMore.bind(this)}
                      >
                        Load more
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
            <BottomBar />
          </div>
        )}
        {this.state.darkmode === true && (
          <div className="wholescreen has-background-dark">
            <ReactTooltip
              effect="solid"
              border
              type="light"
              multiline
              place="top"
            />
            <NavBar />
            <div
              className={
                session.firstLoadOnLogin
                  ? 'maincontent-homescreen-fadein has-background-dark'
                  : 'maincontent-homescreen has-background-dark'
              }
            >
              {' '}
              <table className="table is-striped is-hoverable is-fullwidth is-family-monospace table-darkmode">
                <thead>
                  <tr>
                    <th className="has-text-white">Date</th>
                    <th className="has-text-white">Hash</th>
                    <th className="has-text-white has-text-right">Amount</th>
                    <th className="has-text-white has-text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.transactions.map((tx, index) => {
                    return (
                      <tr key={index}>
                        <td
                          data-tip={
                            tx[0] === 0
                              ? 'This transaction is unconfirmed. Should be confirmed within 30 seconds!'
                              : `Block ${tx[4]}`
                          }
                        >
                          {tx[0] === 0 && (
                            <p className="has-text-danger">Unconfirmed</p>
                          )}
                          {tx[0] > 0 && (
                            <p>{session.convertTimestamp(tx[0])}</p>
                          )}
                        </td>
                        <td>{tx[1]}</td>
                        {tx[2] < 0 && (
                          <td>
                            <p className="has-text-danger has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        {tx[2] > 0 && (
                          <td>
                            <p className="has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        <td>
                          <p className="has-text-right">
                            {session.atomicToHuman(tx[3], true)}
                          </p>
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
                        className="button is-success"
                        onClick={this.handleShowAll.bind(this)}
                      >
                        Show all
                      </button>
                      <button
                        type="submit"
                        className="button is-warning"
                        onClick={this.handleLoadMore.bind(this)}
                      >
                        Load more
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
            <BottomBar />
          </div>
        )}
      </div>
    );
  }
}
