// @flow
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

let displayedTransactionCount: number = 50;

type Props = {};

type State = {
  transactions: Array<any>,
  totalTransactionCount: number,
  firstStartup: boolean,
  darkmode: boolean
};

export default class Home extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length,
      firstStartup: session.firstStartup,
      darkmode: session.darkMode
    };
    this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
      this
    );
    this.openNewWallet = this.openNewWallet.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('openNewWallet', this.openNewWallet);
    const { loginFailed, wallet } = session;
    if (wallet !== undefined) {
      wallet.on('transaction', this.refreshListOnNewTransaction);
    }
    if (session.firstLoadOnLogin && loginFailed === false) {
      this.switchOffAnimation();
    }
    if (!loginFailed) {
      loginCounter.userLoginAttempted = false;
    }
  }

  componentWillUnmount() {
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
    eventEmitter.off('openNewWallet', this.openNewWallet);
    if (session.wallet !== undefined) {
      session.wallet.off('transaction', this.refreshListOnNewTransaction);
    }
  }

  async switchOffAnimation() {
    await sleep(1000);
    session.firstLoadOnLogin = false;
  }

  refreshListOnNewTransaction = () => {
    log.debug('Transaction found, refreshing transaction list...');
    displayedTransactionCount += 1;
    this.setState({
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length
    });
  };

  openNewWallet = () => {
    log.debug('Initialized new wallet session, refreshing transaction list...');
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length
    });
  };

  handleLoadMore = (evt: any) => {
    evt.preventDefault();
    displayedTransactionCount += 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  };

  handleShowAll = (evt: any) => {
    evt.preventDefault();
    const { totalTransactionCount } = this.state;
    this.setState({
      transactions: session.getTransactions(0, totalTransactionCount, false)
    });
  };

  resetDefault = (evt: any) => {
    evt.preventDefault();
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  };

  render() {
    const { darkmode, transactions, firstStartup } = this.state;

    if (firstStartup === true) {
      return <Redirect to="/firststartup" />;
    }

    return (
      <div>
        <Redirector />
        {darkmode === false && (
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
                  {transactions.map(tx => {
                    return (
                      <tr key={tx[1]}>
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
              <form>
                <div className="field">
                  <div className="buttons">
                    <button
                      type="submit"
                      className="button is-success"
                      onClick={this.handleShowAll}
                    >
                      Show all
                    </button>
                    <button
                      type="submit"
                      className="button is-warning"
                      onClick={this.handleLoadMore}
                    >
                      Load more
                    </button>
                    <button
                      type="submit"
                      className="button is-danger"
                      onClick={this.resetDefault}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <BottomBar />
          </div>
        )}
        {darkmode === true && (
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
                  {transactions.map(tx => {
                    return (
                      <tr key={tx[1]}>
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
              <form>
                <div className="field">
                  <div className="buttons">
                    <button
                      type="submit"
                      className="button is-success"
                      onClick={this.handleShowAll}
                    >
                      Show all
                    </button>
                    <button
                      type="submit"
                      className="button is-warning"
                      onClick={this.handleLoadMore}
                    >
                      Load more
                    </button>
                    <button
                      type="submit"
                      className="button is-danger"
                      onClick={this.resetDefault}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <BottomBar />
          </div>
        )}
      </div>
    );
  }
}
