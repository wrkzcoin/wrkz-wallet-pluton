// @flow
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link, withRouter } from 'react-router-dom';
import routes from '../constants/routes';
// import styles from './Home.css';
import { config, session } from '../reducers/index';
import navBar from './NavBar';

type Props = {
  syncStatus: Number,
  unlockedBalance: Number,
  lockedBalance: Number,
  transactions: Array<string>,
  history: any
};

class Home extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions(),
      importSeed: false,
      importKey: false
    };
  }

  handleImportFromSeed(evt, route) {
    log.debug('Reached seed import in renderer process...');
    this.props.history.push('/import');
  }

  handleImportFromKey(evt, route) {
    log.debug('Reached key import in renderer process...')
    this.props.history.push('/importkey');
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
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
        {navBar('wallet')}
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
                    <td>
                      {tx[0] === 0 && (
                        <p className="has-text-danger">Unconfirmed</p>
                      )}
                      {tx[0] > 0 && <p>{session.convertTimestamp(tx[0])}</p>}
                    </td>
                    <td>{tx[1]}</td>
                    <td>
                      {tx[2] < 0 && (
                        <p className="has-text-danger">
                          {session.atomicToHuman(tx[2], true)}
                        </p>
                      )}
                      {tx[2] > 0 && (
                        <p>&nbsp;{session.atomicToHuman(tx[2], true)}</p>
                      )}
                    </td>
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

export default withRouter(Home);
