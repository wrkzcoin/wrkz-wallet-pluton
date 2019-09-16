// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import crypto from 'crypto';
import { remote } from 'electron';
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
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSendToAddressChange = this.handleSendToAddressChange.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('transactionComplete', this.transactionComplete);
    eventEmitter.on('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.on('transactionCancel', this.handleTransactionCancel);
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
  }

  componentWillUnmount() {
    eventEmitter.off('transactionComplete', this.transactionComplete);
    eventEmitter.off('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.off('transactionCancel', this.handleTransactionCancel);
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
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

  handleSubmit = async (event: any) => {
    log.debug('form was submitted!');
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();

    const { displayCurrency, fiatPrice } = this.state;

    eventEmitter.emit('transactionInProgress');

    const [sendToAddress, amount, paymentID] = [
      event.target[0].value.trim(), // sendToAddress
      displayCurrency === 'TRTL'
        ? session.humanToAtomic(event.target[1].value) || 0
        : session.humanToAtomic(event.target[1].value / fiatPrice), // amount
      event.target[3].value || undefined // paymentID
    ];

    if (sendToAddress === '' || amount === '') {
      eventEmitter.emit('transactionCancel');
      return;
    }

    const notSynced = session.getSyncStatus() < 99.99;

    const sufficientFunds =
      (session.getUnlockedBalance() + session.getLockedBalance()) / 100 >
      Number(event.target[1].value);

    const sufficientUnlockedFunds =
      session.getUnlockedBalance() > Number(event.target[1].value) / 100;

    if (notSynced) {
      const userSelection = remote.dialog.showMessageBox(null, {
        type: 'warning',
        buttons: [il8n.ok, il8n.cancel],
        title: 'Wallet Not Synced',
        message:
          'You are attempting to send a transaction without being synced with the network. This may fail. Would you like to proceed?'
      });
      if (userSelection !== 0) {
        eventEmitter.emit('transactionCancel');
        return;
      }
    }

    if (!sufficientFunds) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: 'Not Enough Funds!',
        message: "You don't have enough funds to send this transaction."
      });
      eventEmitter.emit('transactionCancel');
      return;
    }

    if (!sufficientUnlockedFunds) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: 'Not Enough Unlocked Funds!',
        message:
          "You don't have enough unlocked funds to send this transaction. Wait for the funds to unlock and try again."
      });
      eventEmitter.emit('transactionCancel');
      return;
    }

    let displayIfPaymentID;

    if (paymentID !== '' && paymentID !== undefined) {
      displayIfPaymentID = ` with a payment ID of ${paymentID}`;
    } else {
      displayIfPaymentID = '';
    }

    let displayIfNodeFee;

    if (session.daemon.feeAmount > 0) {
      displayIfNodeFee = `and a node fee of ${session.atomicToHuman(
        session.daemon.feeAmount
      )} ${il8n.TRTL}`;
    } else {
      displayIfNodeFee = '';
    }

    const totalTransactionAmount = session.atomicToHuman(
      parseInt(amount, 10) + 10 + parseInt(session.daemon.feeAmount, 10)
    );

    const userSelection = remote.dialog.showMessageBox(null, {
      type: 'warning',
      buttons: [il8n.cancel, il8n.ok],
      title: il8n.title_please_confirm_transaction,
      message: `${il8n.about_to_send_1} ${totalTransactionAmount} ${
        il8n.TRTL
      } ${il8n.to} ${sendToAddress} ${displayIfPaymentID} ${displayIfNodeFee} ${
        il8n.about_to_send_2
      }`
    });

    if (userSelection !== 1) {
      log.debug('Transaction cancelled by user.');
      eventEmitter.emit('transactionCancel');
      return;
    }

    const [hash, err] = await session.sendTransaction(
      sendToAddress,
      amount,
      paymentID
    );
    if (hash) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: [il8n.ok],
        title: il8n.send_tx_complete_title,
        message: `${il8n.send_tx_complete} ${hash}`
      });
      eventEmitter.emit('transactionComplete');
    } else if (err) {
      if (notSynced) {
        remote.dialog.showMessageBox(null, {
          type: 'warning',
          buttons: [il8n.cancel, il8n.ok],
          title: 'Transaction Attempt Failed',
          message:
            "You aren't synced with the network, and the transaction failed to send. Please allow the wallet to completely sync before attempting again."
        });
      } else {
        remote.dialog.showMessageBox(null, {
          type: 'error',
          buttons: [il8n.ok],
          title: il8n.send_tx_error_title,
          message: err.toString()
        });
      }
      eventEmitter.emit('transactionCancel');
    }
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

  confirmTransaction = () => {
    eventEmitter.emit('openModal', 'Yes, this is a new message!');
  };

  createTestTransaction = async () => {
    eventEmitter.emit('transactionInProgress');
    log.debug('Creating test transaction for you.');

    const sendToAddress = session.wallet.getPrimaryAddress();
    const amount = Math.floor(Math.random() * 100) + 1;
    const paymentID = this.generatePaymentID();

    this.setState({
      enteredAmount: String(amount / 100),
      totalAmount: String((amount + 10) / 100),
      sendToAddress
    });

    const [hash, err] = await session.sendTransaction(
      sendToAddress,
      amount,
      paymentID
    );

    if (hash) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: [il8n.ok],
        title: il8n.send_tx_complete_title,
        message: `${il8n.send_tx_complete} ${hash}`
      });
      eventEmitter.emit('transactionCancel');
    } else if (err) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: il8n.send_tx_error_title,
        message: err.toString()
      });
    }
    eventEmitter.emit('transactionCancel');
  };

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

    const { backgroundColor, textColor, elementBaseColor, linkColor } = uiType(
      darkMode
    );

    if (transactionComplete === true) {
      return <Redirect to="/" />;
    }

    return (
      <div>
        <Redirector />
        <Modal />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            effect="solid"
            border
            type="light"
            multiline
            place="top"
          />
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <form onSubmit={this.handleSubmit}>
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
                    {il8n.send}
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
                  {il8n.clear}
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
                    Test
                  </a>
                )}
                <a
                  className="button is-info is-large"
                  onClick={this.confirmTransaction}
                  onKeyPress={this.confirmTransaction}
                  role="button"
                  tabIndex={0}
                  type="action"
                  onMouseDown={event => event.preventDefault()}
                >
                  Modal
                </a>
              </div>
            </form>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
