// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
// import styles from './Counter.css';

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
      <div className>
        <div>
          <nav
            className="navbar"
            role="navigation"
            aria-label="main navigation"
          >
            <div className="navbar-brand">
              <Link to={routes.HOME}>
                <a className="navbar-item" href="#">
                  <img
                    src="./img/trtl-logo.png"
                    alt="logo"
                    className="img-responsive"
                  />
                </a>
              </Link>
              <Link to={routes.HOME}>
                <a className="navbar-item">History</a>
              </Link>
              <Link to={routes.SEND}>
                <a className="navbar-item">Send</a>
              </Link>
              <Link to={routes.COUNTER}>
                <a className="navbar-item is-active">Receive</a>
              </Link>
            </div>
          </nav>
        </div>
        <section>
          <div className="container is-fluid body">
            <div className="notification">
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
              </label>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
