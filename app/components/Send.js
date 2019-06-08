// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { clipboardy } from 'clipboardy';
import routes from '../constants/routes';
// import styles from './Send.css';

type Props = {};

export default class Send extends Component<Props> {
  props: Props;

  render() {
    const {} = this.props;
    return (
      <div>
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
                <a className="navbar-item is-active">Send</a>
              </Link>
              <Link to={routes.COUNTER}>
                <a className="navbar-item">Receive</a>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    );
  }
}
