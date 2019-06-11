// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import { config, session } from '../reducers/index';
import navBar from './NavBar';
import log from 'electron-log';

// import styles from './Send.css';

type Props = {
  syncStatus: Number,
  unlockedBalance: Number,
  lockedBalance: Number,
  transactions: Array<string>,
  handleSubmit: () => void,
};

export default class Send extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions()
    }
  }

  handleSubmit(event) {

    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();

    const [sendToAddress, amount, paymentID, fee] = [
      event.target[0].value,          // sendToAddress
      event.target[1].value,          // amount
      event.target[2].value || undefined,          // paymentID
      event.target[3].value || 0.1    // fee
    ]

    log.debug(`** Sending transaction: Amount: ${amount} Address ${sendToAddress} PID: ${paymentID} Fee ${fee}...`
    );



  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 250);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
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
                    className="input"
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
                  className="input"
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
                    className="input"
                    type="text"
                    placeholder="Enter a payment ID"
                    id="paymentid"
                  />
                </div>
              </label>
            </div>
            <div className="field">
              <label className="label" htmlFor="fee">
                Fee (Optional)
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="Enter desired mining fee"
                    id="fee"
                  />
                </div>
                <p className="help">
                  This will default to the lowest possible fee (0.1 TRTL)
                </p>
              </label>
            </div>
            <div className="buttons">
              <button type="submit" className="button is-success">
                Send
              </button>
              <button type="reset" className="button">
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
