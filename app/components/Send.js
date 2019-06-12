/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import { remote } from 'electron';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import log from 'electron-log';
import routes from '../constants/routes';
import { config, session } from '../reducers/index';
import navBar from './NavBar';

// import styles from './Send.css';

type Props = {
  syncStatus: Number,
  unlockedBalance: Number,
  lockedBalance: Number,
  transactions: Array<string>,
  handleSubmit: () => void,
  transactionInProgress: boolean
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
      transactionInProgress: false
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  async handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    const [sendToAddress, amount, paymentID, fee] = [
      event.target[0].value, // sendToAddress
      event.target[1].value, // amount
      event.target[2].value || undefined, // paymentID
      event.target[3].value || 0.1 // fee
    ];

    const hash = await session.sendTransaction(sendToAddress, amount, paymentID, fee);
  if (hash) {
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: 'Saved!',
      message:
        'Your transaction was sent successfully.\n\n' +
        `${hash}`
    });
    }
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions()
    }));
  }

  render() {
    return (
      <div>
        {navBar()}
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
                Payment ID (Optional)
                <div className="control">
                  <input
                    className="input is-large"
                    type="text"
                    placeholder="Enter a payment ID"
                    id="paymentid"
                  />
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
                <button type="submit" className="button is-success is-large is-loading is-disabled">
                  Send
                </button>
              )}

              <button type="reset" className="button is-large">
                Clear
              </button>
            </div>
          </form>
        </div>
        <div className="box has-background-grey-lighter footerbar">
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Balance:</span>
                <span className="tag is-info is-large">
                  {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
                </span>
              </div>
            </div>
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Sync:</span>
                {this.state.syncStatus < 100 && (
                  <span className="tag is-warning is-large">
                    {this.state.syncStatus}%
                    <ReactLoading
                      type="bubbles"
                      color="#000000"
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
          </div>
        </div>
      </div>
    );
  }
}
