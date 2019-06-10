// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import QRCode from 'qrcode.react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Counter.css';
import { config, session } from '../reducers/index';

type Props = {
  increment: () => void,
  incrementIfOdd: () => void,
  incrementAsync: () => void,
  decrement: () => void,
  counter: Number,
  copyToClipboard: () => void,
  syncStatus: Number,
  unlockedBalance: Number,
  lockedBalance: Number,
  transactions: Array<string>
};

export default class Receive extends Component<Props> {
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
    const {
      increment,
      incrementIfOdd,
      incrementAsync,
      decrement,
      counter,
      copyToClipboard
    } = this.props;
    return (
      <div className="body">
        <div className="columns">
          <div className="column is-three-fifths">
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
                  <a className="navbar-item">Send</a>
                </Link>
                <Link to={routes.COUNTER}>
                  <a className="navbar-item is-active">Receive</a>
                </Link>
                <Link to={routes.ADDRESSES}>
                  <a className="navbar-item">Addresses</a>
                </Link>
              </div>
            </nav>
          </div>
          <div className="column">
            <input
              className="input is-rounded"
              type="text"
              placeholder="Search..."
            />
          </div>
        </div>
        <div className="container is-fluid wrapper">
          <div className="notification">
            <div className="columns">
              <div className="column is-three-quarters">
                <label className="label" htmlFor="receiveaddress">
                  Receiving Address
                  <textarea
                    className="textarea"
                    placeholder={session.address}
                    id="receiveaddress"
                    readOnly
                  />
                  <br />
                  <span>
                    <button
                      type="button"
                      className="button is-success is-large"
                      onClick={() => copyToClipboard()}
                    >
                      Copy to Clipboard
                    </button>
                  </span>
                </label>
              </div>
              <div className="column">
                <br />
                <span>
                  <QRCode
                    value={session.address}
                    renderAs="svg"
                    bgColor="#f5f5f5"
                    size="256"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="field is-grouped is-grouped-multiline">
          <div className="control">
            <div className="tags has-addons">
              <span className="tag is-gray is-large">Balance:</span>
              <span className="tag is-info is-large">
                {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
              </span>
            </div>
          </div>

          <div className="control">
            <div className="tags has-addons">
              <span className="tag is-gray is-large">Synchronization:</span>
              {this.state.syncStatus < 100 && (
                <span className="tag is-warning is-large">
                  {this.state.syncStatus}%
                  <ReactLoading
                    type={'bubbles'}
                    color={'#000000'}
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
    );
  }
}
