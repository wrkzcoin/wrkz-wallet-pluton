// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import QRCode from 'qrcode.react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Counter.css';
import { config, session } from '../reducers/index'

type Props = {
  increment: () => void,
  incrementIfOdd: () => void,
  incrementAsync: () => void,
  decrement: () => void,
  counter: Number,
  copyToClipboard: () => void,
  syncStatus: Number,
};

export default class Receive extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = { syncStatus: session.updateSyncStatus()};
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  tick() {
    this.setState(prevState => ({
      syncStatus: session.updateSyncStatus()
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
                    <button
                      type="button"
                      className="button is-success padding5"
                      onClick={() => copyToClipboard()}
                    >
                      Copy to Clipboard
                    </button>
                    <button type="button" className="button padding5">
                      Use a New Address
                    </button>
                  </label>
                </div>
                <div className="column">
                  <br />
                  <span className={styles.qrcode}>
                    <QRCode
                      value={session.address}
                      renderAs="svg"
                      bgColor="#f5f5f5"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <span className="tag is-white is-large">Synchronization: {this.state.syncStatus}% {this.state.syncStatus < 100 && <ReactLoading type={'bubbles'} color={'#000000'} height={30} width={30} />}</span>
          </div>
      </div>
    );
  }
}
