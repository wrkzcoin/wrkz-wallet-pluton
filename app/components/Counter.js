// @flow
import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Counter.css';

type Props = {
  increment: () => void,
  incrementIfOdd: () => void,
  incrementAsync: () => void,
  decrement: () => void,
  counter: number,
  copyToClipboard: () => void
};

export default class Receive extends Component<Props> {
  props: Props;

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
      <div>
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
                      src={window.config.logo}
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
          <div class="column">
            <input class="input is-rounded" type="text" placeholder="Search..." />
          </div>
        </div>
        <section>
          <div className="container is-fluid body">
            <div className="notification">
              <div className="columns">
                <div className="column is-three-quarters">
                  <label className="label" htmlFor="receiveaddress">
                    Receiving Address
                    <textarea
                      className="textarea"
                      placeholder={window.session.address}
                      id="receiveaddress"
                      readOnly
                    />
                    <button
                      type="button"
                      className="button is-success"
                      onClick={() => copyToClipboard()}
                    >
                      Copy to Clipboard
                    </button>
                    <button type="button" className="button">
                      Use a New Address
                    </button>
                  </label>
                </div>
                <div className="column">
                  <br />
                  <span className={styles.qrcode}>
                    <QRCode value={window.session.address} renderAs="svg" bgColor="#f5f5f5"  />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
