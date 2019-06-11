// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
// import styles from './Home.css';
import { config, session } from '../reducers/index';

type Props = {
  syncStatus: Number,
  unlockedBalance: Number,
  lockedBalance: Number,
  transactions: Array<string>
};

export default class Home extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions()
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
      transactions: session.getTransactions()
    }));
  }

  render() {
    return (
      <div>
        <div className="box  has-background-grey-lighter headerbar">
          <div className="columns">
            <div className="column is-three-fifths">
              <nav
                className="navbar has-background-grey-lighter"
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
                    <a className="navbar-item is-active">Wallet</a>
                  </Link>
                  <Link to={routes.SEND}>
                    <a className="navbar-item">Send</a>
                  </Link>
                  <Link to={routes.COUNTER}>
                    <a className="navbar-item">Receive</a>
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
        </div>
        <div className="maincontent has-background-light">
          <table className="table has-background-light is-striped is-hoverable is-fullwidth is-narrow is-family-monospace">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hash</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {this.state.transactions.map((tx, index) => {
                return (
                  <tr key={index}>
                    <td>{tx[0]}</td>
                    <td>{tx[1]}</td>
                    <td>{tx[2] < 0 && <p className="has-text-danger">{session.atomicToHuman(tx[2], true)}</p>}{tx[2] > 0 && <p>&nbsp;{session.atomicToHuman(tx[2], true)}</p>}</td>
                    <td />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="box has-background-grey-lighter footerbar">
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Balance:</span>
                <span className="tag is-info is-large">
                  {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
                </span>
              </div>
            </div>
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Sync:</span>
                {this.state.syncStatus < 100 && (
                  <span className="tag is-warning is-large">
                    {this.state.syncStatus}%
                    <ReactLoading
                      type="bubbles"
                      color="#000000"
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
      </div>
    );
  }
}
