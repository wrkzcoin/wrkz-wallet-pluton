// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import log from 'electron-log';
import { remote } from 'electron';
import React, { Component, Fragment } from 'react';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter, il8n, loginCounter, config } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';
import Configure from '../Configure';

let displayedTransactionCount: number = 50;

type Props = {};

type State = {
  transactions: Array<any>,
  totalTransactionCount: number,
  darkMode: boolean,
  displayCurrency: string,
  fiatPrice: number,
  fiatSymbol: string,
  symbolLocation: string,
  fiatDecimals: number,
  pageAnimationIn: string,
  expandedRows: string[]
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
      darkMode: session.darkMode,
      displayCurrency: config.displayCurrency,
      fiatPrice: session.fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals,
      pageAnimationIn: loginCounter.getAnimation('/'),
      expandedRows: []
    };
    this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
      this
    );
    this.openNewWallet = this.openNewWallet.bind(this);
    this.modifyCurrency = this.modifyCurrency.bind(this);
    this.expandRow = this.expandRow.bind(this);
    this.openInExplorer = this.openInExplorer.bind(this);
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
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
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
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
  }

  openInExplorer = (event: any) => {
    const hash = event.target.value;

    remote.shell.openExternal(
      `https://explorer.turtlecoin.lol/?search=${encodeURIComponent(hash)}`
    );
  };

  modifyCurrency = (displayCurrency: string) => {
    this.setState({
      displayCurrency
    });
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice
    });
  };

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

  expandRow = (event: any) => {
    const transactionHash = event.target.value;
    const { expandedRows } = this.state;
    if (!expandedRows.includes(transactionHash)) {
      expandedRows.push(transactionHash);
    } else {
      const index = expandedRows.indexOf(transactionHash);
      if (index > -1) {
        expandedRows.splice(index, 1);
      }
    }
    this.setState({
      expandedRows
    });
  };

  render() {
    const {
      darkMode,
      transactions,
      totalTransactionCount,
      fiatPrice,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      fiatDecimals,
      pageAnimationIn,
      expandedRows
    } = this.state;
    const {
      backgroundColor,
      textColor,
      tableMode,
      toolTipColor,
      elementBaseColor,
      fillColor
    } = uiType(darkMode);
    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            effect="solid"
            type={toolTipColor}
            multiline
            place="top"
          />
          <NavBar darkMode={darkMode} />
          <div
            className={`maincontent-homescreen ${backgroundColor} ${pageAnimationIn}`}
          >
            <table
              className={`table is-striped is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
            >
              <thead>
                <tr>
                  <th />
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
                  const rowIsExpanded = expandedRows.includes(tx[1]);
                  const transactionHash = tx[1];
                  const toggleSymbol = rowIsExpanded ? '-' : '+';
                  return (
                    <Fragment key={transactionHash}>
                      <tr>
                        <td>
                          <button
                            value={transactionHash}
                            onClick={this.expandRow}
                            className={`transparent-button ${textColor}`}
                            onMouseDown={event => event.preventDefault()}
                          >
                            {toggleSymbol}
                          </button>
                        </td>
                        <td>
                          {tx[0] === 0 && (
                            <p className="has-text-danger">
                              {il8n.unconfirmed}
                            </p>
                          )}
                          {tx[0] > 0 && (
                            <p>{session.convertTimestamp(tx[0])}</p>
                          )}
                        </td>
                        <td>{tx[1]}</td>
                        {tx[2] < 0 && (
                          <td>
                            <p className="has-text-danger has-text-right">
                              {displayCurrency === Configure.ticker &&
                                session.atomicToHuman(tx[2], true)}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'prefix' &&
                                fiatPrice !== 0 &&
                                `-${fiatSymbol}${session
                                  .formatLikeCurrency(
                                    (
                                      fiatPrice *
                                      session.atomicToHuman(tx[2], false)
                                    ).toFixed(fiatDecimals)
                                  )
                                  .substring(1)}`}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'suffix' &&
                                fiatPrice !== 0 &&
                                `-${session
                                  .formatLikeCurrency(
                                    (
                                      fiatPrice *
                                      session.atomicToHuman(tx[2], false)
                                    ).toFixed(2)
                                  )
                                  .substring(1)}${fiatSymbol}`}
                              {displayCurrency === 'fiat' &&
                                fiatPrice === 0 &&
                                ''}
                            </p>
                          </td>
                        )}
                        {tx[2] > 0 && (
                          <td>
                            <p className="has-text-right">
                              {displayCurrency === Configure.ticker &&
                                session.atomicToHuman(tx[2], true)}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'prefix' &&
                                `${fiatSymbol}${session.formatLikeCurrency(
                                  (
                                    fiatPrice *
                                    session.atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                )}`}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'suffix' &&
                                `${session.formatLikeCurrency(
                                  (
                                    fiatPrice *
                                    session.atomicToHuman(tx[2], false)
                                  ).toFixed(fiatDecimals)
                                )}${fiatSymbol}`}
                            </p>
                          </td>
                        )}
                        <td>
                          <p className="has-text-right">
                            {displayCurrency === Configure.ticker &&
                              session.atomicToHuman(tx[3], true)}
                            {displayCurrency === 'fiat' &&
                              symbolLocation === 'prefix' &&
                              `${fiatSymbol}${session.formatLikeCurrency(
                                (
                                  fiatPrice *
                                  session.atomicToHuman(tx[3], false)
                                ).toFixed(fiatDecimals)
                              )}`}
                            {displayCurrency === 'fiat' &&
                              symbolLocation === 'suffix' &&
                              `${session.formatLikeCurrency(
                                (
                                  fiatPrice *
                                  session.atomicToHuman(tx[3], false)
                                ).toFixed(fiatDecimals)
                              )}${fiatSymbol}`}
                          </p>
                        </td>
                      </tr>
                      {rowIsExpanded && (
                        <tr>
                          <td />
                          <td colSpan={4}>
                            <table className="swing-in-top-fwd">
                              <tbody>
                                <tr className="no-hover">
                                  <td>
                                    <p>
                                      <b>Date & Time</b>
                                      <br />
                                      <b>Confirmations</b>
                                      <br />
                                      <b>Block Height</b>
                                      <br />
                                      <b>Unlock Time</b>
                                      <br />
                                      <b>Transaction Hash</b>
                                      <br />
                                      <b>Payment ID</b>
                                      <br />
                                      <b>Fee</b>
                                      <br />
                                      <b>Amount</b>
                                      <br />
                                    </p>
                                  </td>
                                  <td>
                                    {tx[0] === 0
                                      ? 'Still In Memory Pool'
                                      : session.convertTimestamp(tx[0])}
                                    <br />
                                    {tx[0] !== 0
                                      ? Math.max(
                                          session.daemon.getNetworkBlockCount() -
                                            tx[4],
                                          0
                                        )
                                      : 0}
                                    <br />
                                    {tx[0] === 0
                                      ? 'Still In Memory Pool'
                                      : session.formatLikeCurrency(tx[4])}
                                    <br />
                                    {tx[8]} <br />
                                    {tx[1]} <br />
                                    {tx[5] !== '' ? tx[5] : 'none'}
                                    <br />
                                    {session.atomicToHuman(tx[7], true)} {Configure.ticker}
                                    <br />
                                    <p
                                      className={
                                        tx[2] < 0
                                          ? 'is-negative-transaction has-text-danger'
                                          : ''
                                      }
                                    >
                                      {session.atomicToHuman(tx[2], true)} {Configure.ticker}
                                    </p>
                                    <br />
                                    <br />
                                    <button
                                      className={`button ${elementBaseColor}`}
                                      value={transactionHash}
                                      onClick={this.openInExplorer}
                                    >
                                      View on Block Explorer
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="elem-to-center">
                <div className={`box ${fillColor}`}>
                  <p className={`${textColor} title has-text-centered`}>
                    <i className="fas fa-robot" />
                    &nbsp;&nbsp;Welcome to Pluton!
                  </p>
                  <br />
                  <p className={`${textColor} subtitle has-text-centered`}>
                    You don&apos;t have any transactions yet. They will display
                    here once you do.
                  </p>
                </div>
              </div>
            )}
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
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
