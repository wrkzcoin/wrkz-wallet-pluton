/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import crypto from 'crypto';
import { remote, ipcRenderer } from 'electron';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect, Link } from 'react-router-dom';
import log from 'electron-log';
import { config, session, eventEmitter } from '../index';
import navBar from './NavBar';
import routes from '../constants/routes';

// import styles from './Send.css';

type Props = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>,
  handleSubmit: () => void,
  transactionInProgress: boolean,
  importseed: boolean,
  importkey: boolean
};

export default class Send extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactionInProgress: false,
      importkey: false,
      importseed: false,
      nodeFee: session.daemon.feeAmount || 0,
      transactionComplete: false,
      paymentID: '',
      changePassword: false,
      loginFailed: false,
      enteredAmount: '',
      totalAmount: '',
      gohome: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.transactionComplete = this.transactionComplete.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.generatePaymentID = this.generatePaymentID.bind(this);
    this.resetPaymentID = this.resetPaymentID.bind(this);
    this.handleTransactionInProgress = this.handleTransactionInProgress.bind(
      this
    );
    this.handleTransactionCancel = this.handleTransactionCancel.bind(this);
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(
      this
    );
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleTotalAmountChange = this.handleTotalAmountChange.bind(this);
    this.sendAll = this.sendAll.bind(this);
    this.handlePaymentIDChange = this.handlePaymentIDChange.bind(this);
  }

  componentDidMount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.on('transactionComplete', this.transactionComplete);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.on('transactionCancel', this.handleTransactionCancel);
    eventEmitter.on('openNewWallet', this.transactionComplete);
  }

  componentWillUnmount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.off('transactionComplete', this.transactionComplete);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    eventEmitter.off('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.off('transactionCancel', this.handleTransactionCancel);
    eventEmitter.off('openNewWallet', this.transactionComplete);
  }



  refreshBalanceOnNewTransaction() {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
    });
  }

  handlePasswordChange() {
    this.setState({
      changePassword: true
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

  handleAmountChange(event) {
    const amount = event.target.value;
    if (amount === '') {
      this.setState({
        enteredAmount: amount,
        totalAmount: amount
      });
      return;
    }
    const totalAmount =
      Number(amount) +
      0.1 +
      Number(session.atomicToHuman(session.daemon.feeAmount, false));
    this.setState({
      enteredAmount: amount,
      totalAmount
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
    const amount =
      Number(totalAmount) -
      0.1 -
      Number(session.atomicToHuman(session.daemon.feeAmount, false));
    this.setState({
      enteredAmount: amount,
      totalAmount
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

    const hash = await session.sendTransaction(
      sendToAddress,
      amount,
      paymentID,
      fee
    );
    if (hash) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Saved!',
        message: 'Your transaction was sent successfully.\n\n' + `${hash}`
      });
      eventEmitter.emit('transactionComplete');
    }
  }

  handleImportFromSeed(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importkey: true
    });
  }

  generatePaymentID() {
    const paymentID = crypto.randomBytes(32).toString('hex');
    log.debug(`Generated paymentID: ${paymentID}`);
    this.setState({ paymentID });
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
  }

  handlePaymentIDChange(event) {
    this.setState({ paymentID: event.target.value });
  }

  resetPaymentID(event) {
    this.setState({ paymentID: '', enteredAmount: '', totalAmount: '' });
  }

  sendAll() {
    this.setState({
      enteredAmount: session.atomicToHuman((this.state.unlockedBalance - 10), false),
      totalAmount:
        session.atomicToHuman(this.state.unlockedBalance, false)
    });
  }

  render() {
    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }
    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }

    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }

    if (this.state.transactionComplete === true) {
      return <Redirect to="/" />;
    }

    if (this.state.changePassword === true) {
      return <Redirect to="/changepassword" />;
    }

    return (
      <div>
        {navBar('send', false)}
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
                <button type="submit" className="button is-success is-large ">
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
        <div className="footerbar has-background-light">
          <div className="field is-grouped is-grouped-multiline is-grouped-right">
            {this.state.nodeFee > 0 && (
              <div className="control statusicons">
                <div className="tags has-addons">
                  <span className="tag is-large">Node Fee:</span>
                  <span className="tag is-danger is-large">
                    {session.atomicToHuman(this.state.nodeFee, true)} TRTL
                  </span>
                </div>
              </div>
            )}
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-large is-white">Sync:</span>
                {this.state.syncStatus < 100 &&
                  session.daemon.networkBlockCount !== 0 && (
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
                {this.state.syncStatus === 100 &&
                  session.daemon.networkBlockCount !== 0 && (
                    <span className="tag is-success is-large">
                      {this.state.syncStatus}%
                    </span>
                  )}
                {session.daemon.networkBlockCount === 0 && (
                  <span className="tag is-danger is-large">Node Offline</span>
                )}
              </div>
            </div>
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-large is-white">Balance:</span>
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
