// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Counter.css';
import routes from '../constants/routes';
import { WalletBackend } from 'turtlecoin-wallet-backend';

type Props = {
  increment: () => void,
  incrementIfOdd: () => void,
  incrementAsync: () => void,
  decrement: () => void,
  counter: number
};

export default class Counter extends Component<Props> {
  props: Props;

  render() {
    const {
      increment,
      incrementIfOdd,
      incrementAsync,
      decrement,
      counter
    } = this.props;
    return (
      <div>
        <nav className="navbar" role="navigation" aria-label="main navigation">
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
            <Link to={routes.COUNTER}>
              <a className="navbar-item">Send</a>
            </Link>
            <Link to={routes.COUNTER}>
              <a className="navbar-item">Receive</a>
            </Link>
          </div>
        </nav>
        <br />
        <div>
          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label">Receive Address:</label>
            </div>
            <div className="field-body">
              <div className="field">
                <p className="control">
                  <input className="input" type="receive-address" value={window.session.address} readonly />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
