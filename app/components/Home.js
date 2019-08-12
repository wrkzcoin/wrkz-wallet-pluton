// @flow
import log from 'electron-log';
import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter, il8n, loginCounter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';

let displayedTransactionCount: number = 50;

type Props = {};

type State = {
  transactions: Array<any>,
  totalTransactionCount: number,
  darkMode: boolean
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
      darkMode: session.darkMode
    };
    this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
      this
    );
    this.openNewWallet = this.openNewWallet.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('openNewWallet', this.openNewWallet);
    const { loginFailed, wallet, firstLoadOnLogin } = session;
    if (wallet) {
      wallet.on('transaction', this.refreshListOnNewTransaction);
    }
    if (firstLoadOnLogin && loginFailed === false) {
      this.switchOffAnimation();
    }
  }

  componentWillUnmount() {
    displayedTransactionCount = 50;
    const { wallet } = session;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
    eventEmitter.off('openNewWallet', this.openNewWallet);
    if (wallet) {
      session.wallet.off('transaction', this.refreshListOnNewTransaction);
    }
  }

  switchOffAnimation() {
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
    const { darkMode, transactions, totalTransactionCount } = this.state;
    const { backgroundColor, textColor, tableMode } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
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
              loginCounter.navBarCount > 0
                ? `maincontent-homescreen ${backgroundColor}`
                : `maincontent-homescreen-fadein ${backgroundColor}`
            }
          >
            <table
              className={`table is-striped is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
            >
              <thead>
                <tr>
                  <th className={textColor}>{il8n.date}</th>
                  <th className={textColor}>{il8n.hash}</th>
                  <th className={`has-text-right ${textColor}`}>
                    {il8n.amount}
                  </th>
                  <th className={`has-text-right ${textColor}`}>
                    {il8n.balance}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  return (
                    <tr key={tx[1]}>
                      <td
                        data-tip={
                          tx[0] === 0
                            ? il8n.unconfirmed_tx_30_sec_confirm
                            : `${il8n.block} ${tx[4]}`
                        }
                      >
                        {tx[0] === 0 && (
                          <p className="has-text-danger">{il8n.unconfirmed}</p>
                        )}
                        {tx[0] > 0 && <p>{session.convertTimestamp(tx[0])}</p>}
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
            {totalTransactionCount > 50 && (
              <form>
                <div className="field">
                  <div className="buttons">
                    <button
                      type="submit"
                      className="button is-success"
                      onClick={this.handleShowAll}
                    >
                      {il8n.show_all}
                    </button>
                    <button
                      type="submit"
                      className="button is-warning"
                      onClick={this.handleLoadMore}
                    >
                      {il8n.load_more}
                    </button>
                    <button
                      type="submit"
                      className="button is-danger"
                      onClick={this.resetDefault}
                    >
                      {il8n.reset}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          <BottomBar />
        </div>
      </div>
    );
  }
}
