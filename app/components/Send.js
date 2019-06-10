// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import { config, session } from '../reducers/index'

// import styles from './Send.css';

type Props = {
  syncStatus: Number;
  unlockedBalance: Number;
  lockedBalance: Number;
  transactions: Array<string>;
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
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 100);
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
      <div className="body">
        <div className="columns">
          <div class="column is-three-fifths">
            <nav
              className="navbar"
              role="navigation"
              aria-label="main navigation"
            >
              <div className="navbar-brand">
                <Link to={routes.HOME}>
                  <a className="navbar-item" href="#">
                    <img
                      src={config.logo}
                      alt="logo"
                      className="img-responsive"
                    />
                  </a>
                </Link>
                <Link to={routes.HOME}>
                  <a className="navbar-item">Wallet</a>
                </Link>
                <Link to={routes.SEND}>
                  <a className="navbar-item is-active">Send</a>
                </Link>
                <Link to={routes.COUNTER}>
                  <a className="navbar-item">Receive</a>
                </Link>
                <Link to={routes.ADDRESSES}>
                  <a className="navbar-item">Addresses</a>
                </Link>
              </div>
            </nav>
          </div>
          <div class="column">
            <input class="input is-rounded" type="text" placeholder="Search..." />
          </div>
      </div>
          <div className="container is-fluid wrapper">
            <div className="notification">
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
              <button type="submit" className="button is-success">
                Send
              </button>
              <button type="submit" className="button">
                Clear
              </button>
            </div>
          </div>
          <div class="field is-grouped is-grouped-multiline">
            <div class="control">
              <div class="tags has-addons">
                <span class="tag is-gray is-large">Balance:</span>
                <span class="tag is-info is-large">{session.atomicToHuman(this.state.unlockedBalance, true)} TRTL</span>
              </div>
            </div>

            <div class="control">
              <div class="tags has-addons">
                <span class="tag is-gray is-large">Synchronization:</span>
                {this.state.syncStatus < 100 && <span class="tag is-warning is-large">{this.state.syncStatus}%<ReactLoading type={'bubbles'} color={'#000000'} height={30} width={30} /></span>}
                {this.state.syncStatus === 100 && <span class="tag is-success is-large">{this.state.syncStatus}%</span>}
              </div>
            </div>
          </div>
      </div>
    );
  }
}
