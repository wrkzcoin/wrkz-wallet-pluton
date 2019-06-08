// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
// import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
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
    );
  }
}

/*
        <div className="Site-content">
          <table className="table is-striped is-hoverable is-fullwidth">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hash</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>May 06 2019 01:39</td>
                <td>
                  709aa64a95b5561192769064fad55b1b07d7178418b357cb44082d61453bda39
                </td>
                <td>+13.37</td>
                <td>113.37</td>
              </tr>
              <tr>
                <td>May 06 2019 01:37</td>
                <td>
                  b92b66cc9c9123b1885b1fb0aabb396d3344ffef880f7c3b534c2ae4984a6bf0
                </td>
                <td>+100.00</td>
                <td>100.00</td>
              </tr>
            </tbody>
          </table>
        </div>
*/
