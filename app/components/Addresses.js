// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
// import styles from './Home.css';
import { config, session } from '../reducers/index';

type Props = {};

export default class Addresses extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions(),
      addresses: session.getAddresses()
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
      transactions: session.getTransactions(),
      addresses: session.getAddresses()
    }));
  }

  render() {
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
                  <a className="navbar-item">Receive</a>
                </Link>
                <Link to={routes.ADDRESSES}>
                  <a className="navbar-item is-active">Addresses</a>
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
        <div className="wrapper">
          <table className="table is-striped is-hoverable is-fullwidth is-narrow">
            <thead>
              <tr>
                <th>
                  <i className="fa fa-plus-circle" />
                </th>
                <th>Address</th>
                <th>Balance</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {this.state.addresses.map((address, index) => {
                return (
                  <tr key={index}>
                    <td />
                    <td>
                      <p className="help">{address}</p>
                    </td>
                    <td>
                      {session.atomicToHuman(
                        session.getUnlockedBalance([address]),
                        true
                      )}
                    </td>
                    <td>{session.getTransactions().length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
