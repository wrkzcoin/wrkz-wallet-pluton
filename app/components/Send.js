// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import crypto from 'crypto';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter, il8n, config } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import Modal from './Modal';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  unlockedBalance: number,
  enteredAmount: string,
  totalAmount: string,
  paymentID: string,
  darkMode: boolean,
  transactionInProgress: boolean,
  transactionComplete: boolean,
  displayCurrency: string,
  fiatPrice: number,
  fiatSymbol: string,
  symbolLocation: string,
  sendToAddress: string
};

export default class Send extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      enteredAmount: '',
      totalAmount: '',
      sendToAddress: '',
      paymentID: '',
      darkMode: session.darkMode,
      transactionInProgress: false,
      transactionComplete: false,
      displayCurrency: config.displayCurrency,
      fiatPrice: session.fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation
    };
    this.transactionComplete = this.transactionComplete.bind(this);
    this.generatePaymentID = this.generatePaymentID.bind(this);
    this.resetPaymentID = this.resetPaymentID.bind(this);
    this.handleTransactionInProgress = this.handleTransactionInProgress.bind(
      this
    );
    this.handleTransactionCancel = this.handleTransactionCancel.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleTotalAmountChange = this.handleTotalAmountChange.bind(this);
    this.sendAll = this.sendAll.bind(this);
    this.handlePaymentIDChange = this.handlePaymentIDChange.bind(this);
    this.updateFiatPrice = this.updateFiatPrice.bind(this);
    this.handleSendToAddressChange = this.handleSendToAddressChange.bind(this);
    this.confirmTransaction = this.confirmTransaction.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('transactionComplete', this.transactionComplete);
    eventEmitter.on('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.on('transactionCancel', this.handleTransactionCancel);
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
    eventEmitter.on('confirmTransaction', this.sendTransaction);
  }

  componentWillUnmount() {
    eventEmitter.off('transactionComplete', this.transactionComplete);
    eventEmitter.off('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.off('transactionCancel', this.handleTransactionCancel);
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
    eventEmitter.off('confirmTransaction', this.sendTransaction);
  }

  modifyCurrency = (displayCurrency: string) => {
    this.setState({
      displayCurrency
    });
    this.resetAmounts();
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice
    });
  };

  handleTransactionInProgress = () => {
    this.setState({
      transactionInProgress: true
    });
  };

  handleTransactionCancel = () => {
    this.setState({
      transactionInProgress: false
    });
  };

  transactionComplete = () => {
    this.setState({
      transactionComplete: true,
      transactionInProgress: false
    });
  };

  handleAmountChange = (event: any) => {
    const { displayCurrency, fiatPrice } = this.state;
    let enteredAmount = event.target.value;
    if (enteredAmount === '') {
      this.setState({
        enteredAmount: '',
        totalAmount: ''
      });
      return;
    }
    if (enteredAmount === '.') {
      enteredAmount = '0.';
    }

    const regex = /^\d*(\.(\d\d?)?)?$/;
    if (!regex.test(enteredAmount) === true) {
      return;
    }

    const fee = displayCurrency === 'TRTL' ? 0.1 : 0.1 * fiatPrice;

    const totalAmount = (
      parseFloat(enteredAmount) +
      fee +
      parseFloat(session.daemon.feeAmount / 100)
    ).toFixed(2);
    this.setState({
      enteredAmount,
      totalAmount
    });
  };

  handleSendToAddressChange = (event: any) => {
    const sendToAddress = event.target.value;
    this.setState({
      sendToAddress
    });
  };

  handleTotalAmountChange = (event: any) => {
    let totalAmount = event.target.value;
    if (totalAmount === '') {
      this.setState({
        enteredAmount: '',
        totalAmount: ''
      });
      return;
    }
    if (totalAmount === '.') {
      totalAmount = '0.';
    }

    const regex = /^\d*(\.(\d\d?)?)?$/;
    if (!regex.test(totalAmount) === true) {
      return;
    }

    const subtractFee =
      Number(totalAmount) * 100 - 10 - parseInt(session.daemon.feeAmount, 10);

    const enteredAmount =
      subtractFee < 0
        ? ''
        : session.atomicToHuman(subtractFee, false).toFixed(2);

    this.setState({
      enteredAmount,
      totalAmount
    });
  };

  confirmTransaction = (event: any) => {
    event.preventDefault();
    const { sendToAddress, totalAmount, paymentID, darkMode } = this.state;
    const { textColor } = uiType(darkMode);
    const sufficientFunds =
      (session.getUnlockedBalance() + session.getLockedBalance()) / 100 >=
      Number(totalAmount);

    const sufficientUnlockedFunds =
      session.getUnlockedBalance() > Number(totalAmount) / 100;

    if (sendToAddress === '' || totalAmount === '') {
      return;
    }

    if (!sufficientFunds) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The transaction was not successful. You don&apos;t have enough
            funds!
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
      return;
    }

    if (!sufficientUnlockedFunds) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The transaction was not successful.
          </p>
          <p className={`subtitle ${textColor}`}>
            You don&apos;t have enough unlocked funds! Wait until your funds
            unlock then try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
      return;
    }

    const message = (
      <div>
        <center>
          <p className={`title ${textColor}`}>Confirm Transaction</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          <b>Send to:</b>
          <br />
          {sendToAddress}
        </p>
        <p className={`subtitle ${textColor}`}>
          <b>Amount (w/ fee):</b>
          <br />
          {totalAmount}
        </p>
        {paymentID !== '' && (
          <p className={`subtitle ${textColor}`}>
            <b>Payment ID:</b>
            <br />
            {paymentID}
          </p>
        )}
      </div>
    );
    eventEmitter.emit(
      'openModal',
      message,
      'Send it!',
      'Wait a minute...',
      'confirmTransaction'
    );
  };

  sendTransaction = async () => {
    eventEmitter.emit('transactionInProgress');

    const notSynced = session.getSyncStatus() < 99.99;
    const { sendToAddress, enteredAmount, paymentID, darkMode } = this.state;
    const { textColor } = uiType(darkMode);

    const [hash, err] = await session.sendTransaction(
      sendToAddress,
      Number(enteredAmount) * 100,
      paymentID
    );
    if (hash) {
      const message = (
        <div>
          <center>
            <p className={`title ${textColor}`}>Success!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Transaction succeeded! Transaction hash:
          </p>
          <p className={`subtitle ${textColor}`}>{hash}</p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
      eventEmitter.emit('transaction');
      this.resetPaymentID();
    } else if (err) {
      if (notSynced) {
        const message = (
          <div>
            <center>
              <p className="title has-text-danger">Error!</p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              The transaction was not successful. The wallet isn&apos;t synced.
              Wait until you are synced and try again.
            </p>
          </div>
        );
        eventEmitter.emit(
          'openModal',
          message,
          'OK',
          null,
          'transactionCancel'
        );
      } else {
        const message = (
          <div>
            <center>
              <p className="title has-text-danger">Error!</p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              The transaction was not successful.
            </p>
            <p className={`subtitle ${textColor}`}>{err.toString()}</p>
          </div>
        );
        eventEmitter.emit(
          'openModal',
          message,
          'OK',
          null,
          'transactionCancel'
        );
      }
    }
    eventEmitter.emit('transactionCancel');
  };

  createTestTransaction = async () => {
    log.debug('Creating test transaction for you.');

    const sendToAddress = await session.wallet.getPrimaryAddress();
    const amount = Math.floor(Math.random() * 100) + 1;
    const paymentID = this.generatePaymentID();

    await this.setState({
      enteredAmount: String(amount / 100),
      totalAmount: String((amount + 10) / 100),
      sendToAddress,
      paymentID
    });

    this.sendTransaction();
  };

  generatePaymentID = () => {
    const paymentID = crypto.randomBytes(32).toString('hex');
    log.debug(`Generated paymentID: ${paymentID}`);
    this.setState({ paymentID });
    return paymentID;
  };

  handlePaymentIDChange = (event: any) => {
    this.setState({ paymentID: event.target.value });
  };

  resetPaymentID = () => {
    this.setState({
      paymentID: '',
      enteredAmount: '',
      totalAmount: '',
      sendToAddress: ''
    });
  };

  resetAmounts = () => {
    this.setState({ enteredAmount: '', totalAmount: '' });
  };

  sendAll = () => {
    const { unlockedBalance, fiatPrice, displayCurrency } = this.state;

    const totalAmount =
      unlockedBalance - 10 - parseInt(session.daemon.feeAmount, 10) <= 0
        ? 0
        : unlockedBalance;
    const enteredAmount =
      unlockedBalance - 10 - parseInt(session.daemon.feeAmount, 10) <= 0
        ? 0
        : totalAmount - 10 - parseInt(session.daemon.feeAmount, 10);
    this.setState({
      totalAmount:
        displayCurrency === 'TRTL'
          ? session.atomicToHuman(totalAmount, false).toString()
          : session.atomicToHuman(totalAmount * fiatPrice, false).toString(),
      enteredAmount:
        displayCurrency === 'TRTL'
          ? session.atomicToHuman(enteredAmount, false).toString()
          : session.atomicToHuman(enteredAmount * fiatPrice, false).toString()
    });
  };

  roundDown(x: number) {
    return Math.floor(x * 100) / 100;
  }

  render() {
    const {
      transactionComplete,
      darkMode,
      enteredAmount,
      totalAmount,
      paymentID,
      transactionInProgress,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      sendToAddress
    } = this.state;

    const exampleAmount =
      symbolLocation === 'prefix' ? `${fiatSymbol}100` : `100${fiatSymbol}`;

    const {
      backgroundColor,
      textColor,
      elementBaseColor,
      linkColor,
      toolTipColor
    } = uiType(darkMode);

    if (transactionComplete === true) {
      return <Redirect to="/" />;
    }

    return (
      <div>
        <Redirector />
        <Modal darkMode={darkMode} />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            effect="solid"
            type={toolTipColor}
            multiline
            place="top"
          />
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <form onSubmit={this.confirmTransaction}>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="address">
                  {il8n.send_to_address}
                  <div className="control">
                    <input
                      className="input is-large"
                      type="text"
                      placeholder={il8n.send_to_address_input_placeholder}
                      value={sendToAddress}
                      onChange={this.handleSendToAddressChange}
                    />
                  </div>
                </label>
              </div>
              <div className="field">
                <div className="control">
                  <div className="columns">
                    <div className="column">
                      <label className={`label ${textColor}`} htmlFor="amount">
                        {il8n.amount_to_send}
                        <input
                          className="input is-large"
                          type="text"
                          placeholder={`How much to send (eg. ${
                            displayCurrency === 'fiat'
                              ? exampleAmount
                              : '100 TRTL'
                          })`}
                          value={enteredAmount}
                          onChange={this.handleAmountChange}
                        />
                        <a
                          onClick={this.sendAll}
                          onKeyPress={this.sendAll}
                          role="button"
                          tabIndex={0}
                          className={linkColor}
                          onMouseDown={event => event.preventDefault()}
                        >
                          {il8n.send_all}
                        </a>
                      </label>
                    </div>
                    <div className="column">
                      <label
                        className={`label ${textColor}`}
                        htmlFor="totalamount"
                      >
                        {il8n.total_with_fees}
                        <input
                          className="input is-large"
                          type="text"
                          placeholder={il8n.total_with_fees_input_placeholder}
                          value={totalAmount}
                          onChange={this.handleTotalAmountChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="paymentid">
                  {il8n.payment_id}
                  <div className="control">
                    <input
                      className="input is-large"
                      type="text"
                      placeholder={il8n.payment_id_input_placeholder}
                      value={paymentID}
                      onChange={this.handlePaymentIDChange}
                    />
                    <a
                      onClick={this.generatePaymentID}
                      onKeyPress={this.generatePaymentID}
                      role="button"
                      tabIndex={0}
                      className={linkColor}
                      onMouseDown={event => event.preventDefault()}
                    >
                      {il8n.generate_payment_id}
                    </a>
                  </div>
                </label>
              </div>
              <div className="buttons">
                {!transactionInProgress && (
                  <button type="submit" className="button is-success is-large">
                    <span className="icon is-small">
                      <i className="fa fa-paper-plane" />
                    </span>
                    &nbsp;&nbsp;{il8n.send}
                  </button>
                )}
                {transactionInProgress && (
                  <button
                    type="submit"
                    className="button is-success is-large is-loading is-disabled"
                  >
                    {il8n.send}
                  </button>
                )}

                <button
                  type="reset"
                  className={`button is-large ${elementBaseColor}`}
                  onClick={this.resetPaymentID}
                >
                  <span className="icon is-small">
                    <i className="fa fa-undo" />
                  </span>
                  &nbsp;&nbsp;{il8n.clear}
                </button>
                {isDev && (
                  <a
                    className="button is-warning is-large"
                    onClick={this.createTestTransaction}
                    onKeyPress={this.createTestTransaction}
                    role="button"
                    tabIndex={0}
                    type="action"
                    onMouseDown={event => event.preventDefault()}
                  >
                    <span className="icon is-small">
                      <i className="fa fa-flask" />
                    </span>
                    &nbsp;&nbsp;Test
                  </a>
                )}
              </div>
            </form>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
