// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';

type Props = {};

export default class Addresses extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = { syncStatus: window.session.updateSyncStatus()};
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  tick() {
    this.setState(prevState => ({
      syncStatus: window.session.updateSyncStatus()
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
                  <a className="navbar-item">Receive</a>
                </Link>
                <Link to={routes.ADDRESSES}>
                <a className="navbar-item is-active">Addresses</a>
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
                <th>Address</th>
                <th>Balance</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <p className="help">TRTLuzUt6Eu1nT9UMMaJZNSiLbZB4LBnRje1N8XS6L6KJ6qgK1HQidNiDsuSTuYXVCNTSTbvZ7CVARpKxPFyRNMWZUcPxKjMzFe</p>
                </td>
                <td>420</td>
                <td>1</td>
              </tr>
              <tr>
                <td>
                  <p className="help">TRTLuy4pxXa69MkSq4f5WgL42iw4iJtxiBJU6sQQqyaUYwWRaLuTBTPCJoH3c6E8roiujYVtgoT1PGyEjoRvHgLX7XiZaYKxkA4</p>
                </td>
                <td>300</td>
                <td>1</td>
              </tr>
              <tr>
                <td>
                  <p className="help">TRTLv3fwwPY5bdcBnkhAuR8YbSjwFr2fqEFG8c2nbQWmQcwMrwipbxCMgvqdqK4LRFF7aN3oCNzMKLodUVJnRGXZUx7SmDwBiKe</p>
                </td>
                <td>310.37</td>
                <td>2</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <span className="tag is-white is-large">Synchronization: {this.state.syncStatus}% {this.state.syncStatus < 100 && <ReactLoading type={'bubbles'} color={'#000000'} height={30} width={30} />}</span>
        </div>
      </div>
    );
  }
}
