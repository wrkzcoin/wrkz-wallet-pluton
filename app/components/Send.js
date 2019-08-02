/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import crypto from 'crypto';
import { remote, ipcRenderer } from 'electron';
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import log from 'electron-log';
import { session, eventEmitter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';


type Props = {};

export default class Send extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      enteredAmount: '',
      totalAmount: '',
      paymentID: '',
      darkMode: session.darkMode,
      transactionInProgress: false,
      transactionComplete: false,
      loginFailed: false,
      gohome: false,
      transactionFailed: false
    };
    this.transactionComplete = this.transactionComplete.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
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
  }

  componentDidMount() {
    eventEmitter.on('transactionComplete', this.transactionComplete);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.on('transactionCancel', this.handleTransactionCancel);
    eventEmitter.on('openNewWallet', this.transactionComplete);
  }

  componentWillUnmount() {
    eventEmitter.off('transactionComplete', this.transactionComplete);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    eventEmitter.off('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.off('transactionCancel', this.handleTransactionCancel);
    eventEmitter.off('openNewWallet', this.transactionComplete);
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
    });
  }

  handleTransactionInProgress() {
    this.setState({
      transactionInProgress: true
    });
  }

  handleTransactionCancel() {
    this.setState({
      transactionInProgress: false
    });
  }

  transactionComplete() {
    this.setState({
      transactionComplete: true,
      transactionInProgress: false
    });
  }

  handleTransactionFailed() {
    this.setState({
      transactionFailed: true
    });
  }

  handleAmountChange(event) {
    const amount = event.target.value;
    if (amount === '') {
      this.setState({
        enteredAmount: amount,
        totalAmount: amount
      });
      return;
    }
    if (isNaN(amount)) {
      return;
    }
    if (amount < 0) {
      return;
    }
    const totalAmount = session.atomicToHuman(
      Number(amount * 100) + 10 + Number(session.daemon.feeAmount),
      false
    );
    this.setState({
      enteredAmount: amount,
      totalAmount: totalAmount
    });
  }

  handleTotalAmountChange(event) {
    const totalAmount = event.target.value;
    if (totalAmount === '') {
      this.setState({
        enteredAmount: '',
        totalAmount: ''
      });
      return;
    }
    if (isNaN(totalAmount)) {
      return;
    }
    if (totalAmount < 0) {
      return;
    }
    const amount = session.atomicToHuman(
      Number(totalAmount * 100) - 10 - Number(session.daemon.feeAmount),
      false
    );
    this.setState({
      enteredAmount: amount,
      totalAmount: totalAmount
    });
  }

  async handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();

    eventEmitter.emit('transactionInProgress');

    const [sendToAddress, amount, paymentID, fee] = [
      event.target[0].value.trim(), // sendToAddress
      session.humanToAtomic(event.target[1].value) || 0, // amount
      event.target[3].value || undefined // paymentID
    ];

    if (sendToAddress === '' || amount === '') {
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
      displayIfNodeFee = ` and a node fee of ${session.atomicToHuman(
        session.daemon.feeAmount
      )} TRTL`;
    } else {
      displayIfNodeFee = '';
    }

    const totalTransactionAmount = session.atomicToHuman(
      parseInt(amount, 10) + 10 + parseInt(session.daemon.feeAmount, 10)
    );

    const userSelection = remote.dialog.showMessageBox(null, {
      type: 'warning',
      buttons: ['Cancel', 'OK'],
      title: 'Please Confirm Transaction',
      message: `You are about to send ${totalTransactionAmount} TRTL to ${sendToAddress}${displayIfPaymentID} which includes a network fee of 0.10 TRTL${displayIfNodeFee}. Do you wish to proceed?`
    });

    if (userSelection !== 1) {
      log.debug('Transaction cancelled by user.');
      eventEmitter.emit('transactionCancel');
      return;
    }

    const [hash, err] = await session.sendTransaction(
      sendToAddress,
      amount,
      paymentID,
      fee
    );
    if (hash) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Transaction Sent!',
        message: `Your transaction was sent successfully.\nTransaction hash: ${hash}`
      });
      eventEmitter.emit('transactionComplete');
    } else if (err) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Transaction Error',
        message: err.toString()
      });
      eventEmitter.emit('transactionCancel');
    }
  }

  generatePaymentID() {
    const paymentID = crypto.randomBytes(32).toString('hex');
    log.debug(`Generated paymentID: ${paymentID}`);
    this.setState({ paymentID });
  }

  handlePaymentIDChange(event) {
    this.setState({ paymentID: event.target.value });
  }

  resetPaymentID(event) {
    this.setState({ paymentID: '', enteredAmount: '', totalAmount: '' });
  }

  sendAll() {
    this.setState({
      enteredAmount: session.atomicToHuman(
        this.state.unlockedBalance - 10,
        false
      ),
      totalAmount: session.atomicToHuman(this.state.unlockedBalance, false)
    });
  }

  render() {
    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }
    if (this.state.transactionComplete === true) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        <Redirector />
        {this.state.darkMode === false && (
          <div className="wholescreen">
            <ReactTooltip
              effect="solid"
              border
              type="dark"
              multiline
              place="top"
            />
            <NavBar />
            <div className="maincontent">
              <form onSubmit={this.handleSubmit}>
                <div className="field">
                  <label className="label" htmlFor="address">
                    Send to Address
                    <div className="control">
                      <input
                        className="input is-large"
                        type="text"
                        placeholder="Enter a TurtleCoin address to send funds to."
                        id="label"
                      />
                    </div>
                  </label>
                </div>
                <div className="field">
                  <div className="control">
                    <div className="columns">
                      <div className="column">
                        <label className="label" htmlFor="amount">
                          Amount to Send
                          <input
                            className="input is-large"
                            type="text"
                            placeholder="How much TRTL to send (eg. 100)"
                            id="amount"
                            value={this.state.enteredAmount}
                            onChange={this.handleAmountChange}
                          />
                          <label className="help">
                            <a onClick={this.sendAll}>Send All</a>
                          </label>
                        </label>
                      </div>
                      <div className="column">
                        <label className="label" htmlFor="totalamount">
                          Total with Fees
                          <input
                            className="input is-large"
                            type="text"
                            placeholder="The total amount including fees"
                            id="totalamount"
                            value={this.state.totalAmount}
                            onChange={this.handleTotalAmountChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label" htmlFor="paymentid">
                    Payment ID (Optional)&nbsp;&nbsp;&nbsp;
                    <div className="control">
                      <input
                        className="input is-large"
                        type="text"
                        placeholder="Enter a payment ID"
                        id="paymentid"
                        value={this.state.paymentID}
                        onChange={this.handlePaymentIDChange}
                      />
                      <label className="help">
                        <a onClick={this.generatePaymentID}>
                          Generate Random Payment ID
                        </a>
                      </label>
                    </div>
                  </label>
                </div>
                <div className="buttons">
                  {!this.state.transactionInProgress && (
                    <button
                      type="submit"
                      className="button is-success is-large "
                    >
                      Send
                    </button>
                  )}
                  {this.state.transactionInProgress && (
                    <button
                      type="submit"
                      className="button is-success is-large is-loading is-disabled"
                    >
                      Send
                    </button>
                  )}

                  <button
                    type="reset"
                    className="button is-large"
                    onClick={this.resetPaymentID}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
            <BottomBar />
          </div>
        )}
        {this.state.darkMode === true && (
          <div className="wholescreen has-background-dark">
            <ReactTooltip
              effect="solid"
              border
              type="light"
              multiline
              place="top"
            />
            <NavBar />
            <div className="maincontent has-background-dark">
              <form onSubmit={this.handleSubmit}>
                <div className="field">
                  <label className="label has-text-white" htmlFor="address">
                    Send to Address
                    <div className="control">
                      <input
                        className="input is-large"
                        type="text"
                        placeholder="Enter a TurtleCoin address to send funds to."
                        id="label"
                      />
                    </div>
                  </label>
                </div>
                <div className="field">
                  <div className="control">
                    <div className="columns">
                      <div className="column">
                        <label
                          className="label has-text-white"
                          htmlFor="amount"
                        >
                          Amount to Send
                          <input
                            className="input is-large"
                            type="text"
                            placeholder="How much TRTL to send (eg. 100)"
                            id="amount"
                            value={this.state.enteredAmount}
                            onChange={this.handleAmountChange}
                          />
                          <label className="help">
                            <a onClick={this.sendAll}>Send All</a>
                          </label>
                        </label>
                      </div>
                      <div className="column">
                        <label
                          className="label has-text-white"
                          htmlFor="totalamount"
                        >
                          Total with Fees
                          <input
                            className="input is-large"
                            type="text"
                            placeholder="The total amount including fees"
                            id="totalamount"
                            value={this.state.totalAmount}
                            onChange={this.handleTotalAmountChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label className="label has-text-white" htmlFor="paymentid">
                    Payment ID (Optional)&nbsp;&nbsp;&nbsp;
                    <div className="control">
                      <input
                        className="input is-large"
                        type="text"
                        placeholder="Enter a payment ID"
                        id="paymentid"
                        value={this.state.paymentID}
                        onChange={this.handlePaymentIDChange}
                      />
                      <label className="help">
                        <a onClick={this.generatePaymentID}>
                          Generate Random Payment ID
                        </a>
                      </label>
                    </div>
                  </label>
                </div>
                <div className="buttons">
                  {!this.state.transactionInProgress && (
                    <button
                      type="submit"
                      className="button is-success is-large "
                    >
                      Send
                    </button>
                  )}
                  {this.state.transactionInProgress && (
                    <button
                      type="submit"
                      className="button is-success is-large is-loading is-disabled"
                    >
                      Send
                    </button>
                  )}

                  <button
                    type="reset"
                    className="button is-large is-black"
                    onClick={this.resetPaymentID}
                  >
                    Clear
                  </button>
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
