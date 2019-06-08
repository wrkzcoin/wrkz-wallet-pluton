// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

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
                      src={window.config.logo}
                      alt="logo"
                      className="img-responsive"
                    />
                  </a>
                </Link>
                <Link to={routes.HOME}>
                  <a className="navbar-item is-active">Wallet</a>
                </Link>
                <Link to={routes.SEND}>
                  <a className="navbar-item">Send</a>
                </Link>
                <Link to={routes.COUNTER}>
                  <a className="navbar-item">Receive</a>
                </Link>
                <Link to={routes.COUNTER}>
                <a className="navbar-item">Addresses</a>
              </Link>
              </div>
            </nav>
          </div>
          <div class="column">
            <input class="input is-rounded" type="text" placeholder="Search..." />
          </div>
    </div>
        <div className="wrapper">
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
                48f88e078a549dc788464348774f10beaf402dc4dc79f7362fbc6f70370af97a
                </td>
                <td>-420.00</td>
                <td>1,030.37</td>
              </tr>
              <tr>
                <td>May 06 2019 01:39</td>
                <td>
                f4e971acd7679e0d0a8cc6c2f0a5eda535c0d8c67bd0732fa2cf78da76eb6b4e
                </td>
                <td>+1,337.00</td>
                <td>1,450.37</td>
              </tr>
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
        <div>
          <span className="tag is-white">Synchronization: 60.00%</span>
          <progress className="progress is-success" value="60" max="100" />
        </div>
      </div>
    );
  }
}
