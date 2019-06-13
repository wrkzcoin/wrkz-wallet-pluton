// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
// import styles from './Home.css';
import { config, session } from '../reducers/index';
import navBar from './NavBar'


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
    this.interval = setInterval(() => this.refresh(), 1000);
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
      <div>
        {navBar('addresses')}
        <div className="maincontent has-background-light">
          <table className="table is-striped is-hoverable is-fullwidth is-narrow is-family-monospace has-background-light">
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
