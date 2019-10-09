// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component, Fragment } from 'react';
import { remote } from 'electron';
import log from 'electron-log';
import { Link } from 'react-router-dom';
import jdenticon from 'jdenticon';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';
import { session, addressList, il8n, config, eventEmitter } from '../index';
import routes from '../constants/routes';

type Props = {
  query: string
};

type States = {
  darkMode: boolean,
  contactResults: string[],
  transactionResults: any[],
  expandedRows: string[],
  displayCurrency: string,
  fiatSymbol: string,
  symbolLocation: string,
  fiatPrice: number
};

export default class Search extends Component<Props, States> {
  props: Props;

  states: States;

  addressList: any[];

  transactions: any[];

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      contactResults: [],
      transactionResults: [],
      expandedRows: [],
      displayCurrency: config.displayCurrency,
      fiatPrice: session.fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      fiatDecimals: config.fiatDecimals
    };
    this.addressList = addressList;
    this.transactions = session.wallet.getTransactions();
    this.getContactResults = this.getContactResults.bind(this);
    this.getTransactionResults = this.getTransactionResults.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;
    this.getContactResults(query);
    this.getTransactionResults(query);
    this.setState({
      query
    });

    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
  }

  componentWillReceiveProps(newProps) {
    const { query } = newProps;
    this.getContactResults(query);
    this.getTransactionResults(query);
    this.setState({
      query
    });

    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
  }

  componentWillUnmount() {}

  expandRow = (event: any) => {
    const hash = event.target.value;
    const { expandedRows } = this.state;
    if (!expandedRows.includes(hash)) {
      expandedRows.push(hash);
    } else {
      const index = expandedRows.indexOf(hash);
      if (index > -1) {
        expandedRows.splice(index, 1);
      }
    }
    this.setState({
      expandedRows
    });
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

  openInExplorer = (event: any) => {
    const hash = event.target.value;

    remote.shell.openExternal(
      `https://explorer.turtlecoin.lol/?search=${encodeURIComponent(hash)}`
    );
  };

  getContactResults = (query: string) => {
    const possibleContactValues = ['name', 'address', 'paymentID'];

    const contactResults = possibleContactValues.map(value => {
      return this.search(query, addressList, value);
    });

    let sanitizedResults = [];

    /* the search function returns a separate array of results for each
       value searched, we need to concat them together with spread */
    for (let i = 0; i < contactResults.length; i++) {
      sanitizedResults = [...contactResults[i], ...sanitizedResults];
    }

    /* We don't want duplicates, so we're going to
       pass the array to a new Set to remove them */
    sanitizedResults = [...new Set(this.filterNullValues(sanitizedResults))];

    this.setState({
      contactResults: sanitizedResults
    });
  };

  getTransactionResults = (query: string) => {
    if (query.length < 4) {
      return;
    }
    const transactions = session.wallet.getTransactions();

    const possibleTransactionValues = ['blockHeight', 'hash', 'paymentID'];

    const transactionResults = possibleTransactionValues.map(value => {
      return this.search(query, transactions, value);
    });

    let sanitizedResults = [];

    /* the search function returns a separate array of results for each
    value searched, we need to concat them together with spread */
    for (let i = 0; i < transactionResults.length; i++) {
      sanitizedResults = [...transactionResults[i], ...sanitizedResults];
    }

    this.setState({
      transactionResults: sanitizedResults
    });
  };

  filterNullValues(arr: any[]) {
    return arr.filter(Boolean);
  }

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    const resultsToReturn = [];
    for (let i = 0; i < arrayToSearch.length; i++) {
      // will resolve to true if the selected value contains the substring, case insensitive
      if (
        String(arrayToSearch[i][objectPropertyName])
          .toUpperCase()
          .includes(searchedValue.toUpperCase())
      ) {
        // return
        resultsToReturn.push(arrayToSearch[i]);
      }
    }
    return resultsToReturn;
  }

  render() {
    const {
      darkMode,
      contactResults,
      transactionResults,
      expandedRows,
      displayCurrency,
      symbolLocation,
      fiatPrice,
      fiatSymbol,
      fiatDecimals
    } = this.state;
    const { query } = this.props;
    const {
      backgroundColor,
      textColor,
      tableMode,
      fillColor,
      elementBaseColor
    } = uiType(darkMode);

    const resultsFound = contactResults.length + transactionResults.length;

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <NavBar darkMode={darkMode} query={query} />
          <div className={`maincontent ${backgroundColor}`}>
            {contactResults.length > 0 && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  <b>Contacts:</b>
                </p>
              </div>
            )}
            {contactResults.length > 0 && (
              <table
                className={`table is-striped is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
              >
                <thead>
                  <tr>
                    <th className={textColor}>Icon</th>
                    <th className={textColor}>Name</th>
                    <th className={textColor}>Address</th>
                    <th className={textColor}>Payment ID</th>
                    <th className="has-text-centered">
                      <a
                        className={textColor}
                        onClick={this.showAddContactForm}
                        onKeyPress={this.showAddContactForm}
                        role="button"
                        tabIndex={0}
                        onMouseDown={event => event.preventDefault()}
                      >
                        <i className="fas fa-user-plus" />
                      </a>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contactResults.map(contact => {
                    const { name, address, paymentID } = contact;
                    return (
                      <tr key={address}>
                        <td>
                          <span
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{
                              __html: jdenticon.toSvg(address, 114)
                            }}
                          />
                        </td>
                        <td>
                          <br />
                          <p className={`subtitle ${textColor}`}>{name}</p>
                        </td>
                        <td>
                          <textarea
                            className={`textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                            defaultValue={address}
                            readOnly
                          />
                        </td>
                        <td>
                          <textarea
                            className={`textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                            defaultValue={paymentID}
                            readOnly
                          />
                        </td>
                        <td>
                          <br />
                          <Link
                            className={textColor}
                            to={`${routes.SEND}/${address}/${paymentID}`}
                          >
                            <i
                              className="fa fa-paper-plane is-size-3 has-text-centered"
                              aria-hidden="true"
                            />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {transactionResults.length > 0 && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  <b>Transactions:</b>
                </p>
              </div>
            )}
            {transactionResults.length > 0 && (
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
                  {transactionResults.map(tx => {
                    const {
                      timestamp,
                      hash,
                      paymentID,
                      fee,
                      unlockTime,
                      blockHeight
                    } = tx;
                    const amount = tx.totalAmount();
                    const balance = 0;

                    const rowIsExpanded = expandedRows.includes(hash);
                    const toggleSymbol = rowIsExpanded ? '-' : '+';

                    log.debug(tx);

                    log.debug(hash);
                    return (
                      <Fragment key={`${hash}-fragment`}>
                        <tr>
                          <td>
                            <button
                              value={hash}
                              onClick={this.expandRow}
                              className={`transparent-button ${textColor}`}
                              onMouseDown={event => event.preventDefault()}
                            >
                              {toggleSymbol}
                            </button>
                          </td>
                          <td>
                            {timestamp === 0 && (
                              <p className="has-text-danger">
                                {il8n.unconfirmed}
                              </p>
                            )}
                            {timestamp > 0 && (
                              <p>{session.convertTimestamp(timestamp)}</p>
                            )}
                          </td>
                          <td>{hash}</td>
                          {amount < 0 && (
                            <td>
                              <p className="has-text-danger has-text-right">
                                {displayCurrency === 'TRTL' &&
                                  session.atomicToHuman(amount, true)}
                                {displayCurrency === 'fiat' &&
                                  symbolLocation === 'prefix' &&
                                  fiatPrice !== 0 &&
                                  `-${fiatSymbol}${session
                                    .formatLikeCurrency(
                                      // $FlowFixMe
                                      (
                                        fiatPrice *
                                        session.atomicToHuman(amount, false)
                                      ).toFixed(fiatDecimals)
                                    )
                                    .substring(1)}`}
                                {displayCurrency === 'fiat' &&
                                  symbolLocation === 'suffix' &&
                                  fiatPrice !== 0 &&
                                  `-${session
                                    .formatLikeCurrency(
                                      // $FlowFixMe
                                      (
                                        fiatPrice *
                                        session.atomicToHuman(amount, false)
                                      ).toFixed(2)
                                    )
                                    .substring(1)}${fiatSymbol}`}
                                {displayCurrency === 'fiat' &&
                                  fiatPrice === 0 &&
                                  ''}
                              </p>
                            </td>
                          )}
                          {amount > 0 && (
                            <td>
                              <p className="has-text-right">
                                {displayCurrency === 'TRTL' &&
                                  session.atomicToHuman(amount, true)}
                                {displayCurrency === 'fiat' &&
                                  symbolLocation === 'prefix' &&
                                  `${fiatSymbol}${session.formatLikeCurrency(
                                    // $FlowFixMe
                                    (
                                      fiatPrice *
                                      session.atomicToHuman(amount, false)
                                    ).toFixed(fiatDecimals)
                                  )}`}
                                {displayCurrency === 'fiat' &&
                                  symbolLocation === 'suffix' &&
                                  `${session.formatLikeCurrency(
                                    // $FlowFixMe
                                    (
                                      fiatPrice *
                                      session.atomicToHuman(amount, false)
                                    ).toFixed(fiatDecimals)
                                  )}${fiatSymbol}`}
                              </p>
                            </td>
                          )}
                          <td>
                            <p className="has-text-right">
                              {displayCurrency === 'TRTL' &&
                                session.atomicToHuman(balance, true)}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'prefix' &&
                                `${fiatSymbol}${session.formatLikeCurrency(
                                  // $FlowFixMe
                                  (
                                    fiatPrice *
                                    session.atomicToHuman(balance, false)
                                  ).toFixed(fiatDecimals)
                                )}`}
                              {displayCurrency === 'fiat' &&
                                symbolLocation === 'suffix' &&
                                `${session.formatLikeCurrency(
                                  // $FlowFixMe
                                  (
                                    fiatPrice *
                                    session.atomicToHuman(balance, false)
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
                                      {timestamp === 0
                                        ? 'Still In Memory Pool'
                                        : session.convertTimestamp(timestamp)}
                                      <br />
                                      {timestamp !== 0
                                        ? Math.max(
                                            session.daemon.getNetworkBlockCount() -
                                              blockHeight,
                                            0
                                          )
                                        : 0}
                                      <br />
                                      {timestamp === 0
                                        ? 'Still In Memory Pool'
                                        : session.formatLikeCurrency(
                                            blockHeight
                                          )}
                                      <br />
                                      {unlockTime} <br />
                                      {hash} <br />
                                      {paymentID !== '' ? paymentID : 'none'}
                                      <br />
                                      {session.atomicToHuman(fee, true)} TRTL
                                      <br />
                                      <p
                                        className={
                                          amount < 0
                                            ? 'is-negative-transaction has-text-danger'
                                            : ''
                                        }
                                      >
                                        {session.atomicToHuman(amount, true)}{' '}
                                        TRTL
                                      </p>
                                      <br />
                                      <br />
                                      <button
                                        className={`button ${elementBaseColor}`}
                                        value={hash}
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
            )}
            {resultsFound === 0 && (
              <div className={`box elem-to-center ${fillColor}`}>
                <p className="title has-text-danger">No results found!</p>{' '}
              </div>
            )}
            <br />
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
