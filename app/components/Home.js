// @flow
import React, { Component } from 'react';
import { Utilities } from 'turtlecoin-wallet-backend';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';
import { config, session } from '../reducers/index'


type Props = {
  syncStatus: Number;
  unlockedBalance: Number;
  lockedBalance: Number;
  transactions: Array<string>;
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
    this.interval = setInterval(() => this.refresh(), 500);
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
              {this.state.transactions.map(( tx, index ) => {
                return (
                  <tr key={index}>
                    <td>{tx[0]}</td>
                    <td>{tx[1]}</td>
                    <td>{session.atomicToHuman(tx[2], true)}</td>
                    <td />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div>
          <span className="tag is-white is-large">Balance: {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL</span>
          <span className="tag is-white is-large">Locked: {session.atomicToHuman(this.state.lockedBalance, true)} TRTL</span>
          <span className="tag is-white is-large">Synchronization: {this.state.syncStatus}% {this.state.syncStatus < 100 && <ReactLoading type={'bubbles'} color={'#000000'} height={30} width={30} />}</span>
        </div>
      </div>
    );
  }
}
