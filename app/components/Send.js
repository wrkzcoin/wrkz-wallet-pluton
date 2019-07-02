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
      transactions: session.getTransactions(),
      transactionInProgress: false,
      importkey: false,
      importseed: false,
      nodeFee: session.daemon.feeAmount,
      transactionComplete: false,
      paymentID: '',
      changePassword: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.transactionComplete = this.transactionComplete.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.on('transactionComplete', this.transactionComplete);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.off('transactionComplete', this.transactionComplete);
  }

  handlePasswordChange() {
    this.setState({
      changePassword: true
    })
  }

  transactionComplete() {
    this.setState({
      transactionComplete: true
    });
  }

  async handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();

    const [sendToAddress, amount, paymentID, fee] = [
      event.target[0].value, // sendToAddress
      event.target[1].value || 0, // amount
      event.target[2].value || undefined, // paymentID
      event.target[3].value || 10 // fee
    ];

    let displayIfPaymentID;

    if (event.target[2].value !== '') {
      displayIfPaymentID = ` with a transaction hash of ${
        event.target[2].value
      }`;
    } else {
      displayIfPaymentID = '';
    }

    let displayIfNodeFee;

    if (session.daemon.feeAmount > 0) {
      displayIfNodeFee = ` and a node fee of ${session.daemon.feeAmount} TRTL`;
    } else {
      displayIfNodeFee = '';
    }

    const totalTransactionAmount =
      parseInt(amount, 10) +
      parseInt(fee, 10) +
      parseInt(session.daemon.feeAmount, 10);

    const userSelection = remote.dialog.showMessageBox(null, {
      type: 'warning',
      buttons: ['Cancel', 'OK'],
      title: 'Please Confirm Transaction',
      message: `You are about to send ${totalTransactionAmount} TRTL to ${sendToAddress}${displayIfPaymentID} which includes a network fee of ${fee} TRTL${displayIfNodeFee}. Do you wish to proceed?`
    });

    if (userSelection !== 1) {
      log.debug('Transaction cancelled by user.');
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
    log.debug('Generated paymentID: ' + paymentID);
    this.setState({paymentID: paymentID});
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
  }

  handlePaymentIDChange(event) {
    this.setState({paymentID: event.target.value});
  }

  resetPaymentID(event) {
    this.setState({paymentID: ''});
  }

  render() {
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
      return <Redirect to="/changepassword" />
    }

    return (
      <div>
        {navBar('send')}
        <div className="box has-background-light maincontent">
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
              <label className="label" htmlFor="amount">
                Amount
                <div className="control">
                  <input
                    className="input is-large"
                    type="text"
                    placeholder="How much TRTL to send (eg. 100)"
                    id="amount"
                  />
                </div>
              </label>
            </div>
            <div className="field">
              <label className="label" htmlFor="paymentid">
                Payment ID (Optional)&nbsp;&nbsp;&nbsp;<a onClick={this.generatePaymentID.bind(this)}>Generate Random Payment ID</a>
                <div className="control">
                  <input
                    className="input is-large"
                    type="text"
                    placeholder="Enter a payment ID"
                    id="paymentid"
                    value={this.state.paymentID}
                    onChange={this.handlePaymentIDChange.bind(this)} />
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

              <button type="reset" className="button is-large" onClick={this.resetPaymentID.bind(this)}>
                Clear
              </button>
            </div>
          </form>
        </div>
        <div className="box has-background-grey-lighter footerbar">
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
