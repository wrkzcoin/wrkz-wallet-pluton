// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
// import styles from './Send.css';

type Props = {};

export default class Send extends Component<Props> {
  props: Props;

  render() {
    const {} = this.props;
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
                  <a className="navbar-item is-active">Send</a>
                </Link>
                <Link to={routes.COUNTER}>
                  <a className="navbar-item">Receive</a>
                </Link>
              </div>
            </nav>
          </div>
          <div class="column">
            <input class="input is-rounded" type="text" placeholder="Search..." />
          </div>
      </div>
        <section>
          <div className="container is-fluid">
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
        </section>
      </div>
    );
  }
}
