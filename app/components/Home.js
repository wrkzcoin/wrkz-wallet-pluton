// @flow
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { session, loginCounter, eventEmitter } from '../index';
import navBar from './NavBar';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let displayedTransactionCount = 50;

type Props = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>,
  history: any,
  importkey: boolean,
  importseed: boolean
};

export default class Home extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length,
      importkey: false,
      importseed: false,
      nodeFee: session.daemon.feeAmount,
      loginFailed: session.loginFailed,
      changePassword: false,
      firstStartup: session.firstStartup,
      darkmode: session.darkMode
    };

    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.refreshListOnNewTransaction = this.refreshListOnNewTransaction.bind(
      this
    );
    this.openNewWallet = this.openNewWallet.bind(this);
    this.refreshNodeFee = this.refreshNodeFee.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.setMaxListeners(1);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.on('transaction', this.refreshListOnNewTransaction);
    }
    eventEmitter.on('openNewWallet', this.openNewWallet);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    if (session.firstLoadOnLogin && this.state.loginFailed === false) {
      this.switchOffAnimation();
    }
    if (!this.state.loginFailed) {
      loginCounter.userLoginAttempted = false;
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    eventEmitter.off('openNewWallet', this.openNewWallet);
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    if (session.wallet !== undefined) {
      session.wallet.off('transaction', this.refreshListOnNewTransaction);
    }
  }

  async switchOffAnimation() {
    await sleep(1000);
    session.firstLoadOnLogin = false;
  }

  handlePasswordChange() {
    this.setState({
      changePassword: true
    });
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
    });
  }

  refreshNodeFee() {
    this.setState({
      nodeFee: session.daemon.feeAmount
    });
  }

  refreshListOnNewTransaction() {
    log.debug('Transaction found, refreshing transaction list...');
    displayedTransactionCount++;
    this.setState({
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length,
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  }

  openNewWallet() {
    log.debug('Initialized new wallet session, refreshing transaction list...');
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(
        0,
        displayedTransactionCount,
        false
      ),
      totalTransactionCount: session.getTransactions().length,
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  }

  handleImportFromSeed(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importkey: true
    });
  }

  handleLoadMore(evt, route) {
    evt.preventDefault();
    displayedTransactionCount += 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  }

  resetDefault(evt, route) {
    evt.preventDefault();
    displayedTransactionCount = 50;
    this.setState({
      transactions: session.getTransactions(0, displayedTransactionCount, false)
    });
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
  }

  render() {
    if (this.state.firstStartup === true) {
      return <Redirect to="/firststartup" />;
    }

    if (this.state.changePassword === true) {
      return <Redirect to="/changepassword" />;
    }

    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }

    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }

    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }

    let balanceTooltip =
      `Unlocked: ${session.atomicToHuman(
        this.state.unlockedBalance,
        true
      )} TRTL<br>` +
      `Locked: ${session.atomicToHuman(this.state.lockedBalance, true)} TRTL`;

    return (
      <div>
        {this.state.darkmode === false && (
          <div className="wholescreen">
            <ReactTooltip
              effect="solid"
              border
              type="dark"
              multiline
              place="top"
            />
            {navBar('wallet', false)}
            <div
              className={
                session.firstLoadOnLogin
                  ? 'maincontent-homescreen-fadein'
                  : 'maincontent-homescreen'
              }
            >
              <table className="table is-striped is-hoverable is-fullwidth is-family-monospace">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hash</th>
                    <th className="has-text-right">Amount</th>
                    <th className="has-text-right">Balance</th>
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
                          {tx[0] > 0 && (
                            <p>{session.convertTimestamp(tx[0])}</p>
                          )}
                        </td>
                        <td>{tx[1]}</td>
                        {tx[2] < 0 && (
                          <td>
                            <p className="has-text-danger has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        {tx[2] > 0 && (
                          <td>
                            <p className="has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        <td>
                          <p className="has-text-right">
                            {session.atomicToHuman(tx[3], true)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {this.state.transactions.length <
                this.state.totalTransactionCount && (
                <form>
                  <div className="field">
                    <div className="buttons">
                      <button
                        type="submit"
                        className="button is-warning"
                        onClick={this.handleLoadMore.bind(this)}
                      >
                        Load more...
                      </button>
                      <button
                        type="submit"
                        className="button is-danger"
                        onClick={this.resetDefault.bind(this)}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
            <div
              className={
                session.firstLoadOnLogin
                  ? 'footerbar-slideup has-background-light'
                  : 'footerbar has-background-light'
              }
            >
              {' '}
              <div className="field is-grouped is-grouped-multiline is-grouped-right">
                {this.state.nodeFee > 0 && (
                  <div className="control statusicons">
                    <div className="tags has-addons">
                      <span className="tag is-large is-white">Node Fee:</span>
                      <span className="tag is-danger is-large">
                        {session.atomicToHuman(this.state.nodeFee, true)} TRTL
                      </span>
                    </div>
                  </div>
                )}
                <div className="control statusicons">
                  <div className="tags has-addons">
                    <span className="tag is-white is-large">Sync:</span>
                    {this.state.syncStatus < 100 &&
                      session.daemon.networkBlockCount !== 0 && (
                        <span className="tag is-warning is-large">
                          {this.state.syncStatus}%
                          <ReactLoading
                            type="bubbles"
                            color="#363636"
                            height={30}
                            width={30}
                          />
                        </span>
                      )}
                    {this.state.syncStatus === 100 &&
                      session.daemon.networkBlockCount !== 0 && (
                        <span className="tag is-success is-large">
                          {this.state.syncStatus}%
                        </span>
                      )}
                    {session.daemon.networkBlockCount === 0 && (
                      <span className="tag is-danger is-large is-loading">
                        <ReactLoading
                          type="spinningBubbles"
                          color="#F5F5F5"
                          height={30}
                          width={30}
                        />
                      </span>
                    )}
                  </div>
                </div>
                <div className="control statusicons">
                  <div className="tags has-addons">
                    <span className="tag is-white is-large">Balance:</span>
                    <span
                      className={
                        this.state.lockedBalance > 0
                          ? 'tag is-warning is-large'
                          : 'tag is-info is-large'
                      }
                      data-tip={balanceTooltip}
                    >
                      {this.state.lockedBalance > 0 ? (
                        <i className="fa fa-lock" />
                      ) : (
                        <i className="fa fa-unlock" />
                      )}
                      &nbsp;
                      {session.atomicToHuman(
                        this.state.unlockedBalance + this.state.lockedBalance,
                        true
                      )}
                      &nbsp;TRTL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.darkmode === true && (
          <div className="wholescreen has-background-dark">
            <ReactTooltip
              effect="solid"
              border
              type="light"
              multiline
              place="top"
            />
            {navBar('wallet', true)}
            <div
              className={
                session.firstLoadOnLogin
                  ? 'maincontent-homescreen-fadein has-background-dark'
                  : 'maincontent-homescreen has-background-dark'
              }
            >
              {' '}
              <table className="table is-striped is-hoverable is-fullwidth is-family-monospace table-darkmode">
                <thead>
                  <tr>
                    <th className="has-text-white">Date</th>
                    <th className="has-text-white">Hash</th>
                    <th className="has-text-white has-text-right">Amount</th>
                    <th className="has-text-white has-text-right">Balance</th>
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
                          {tx[0] > 0 && (
                            <p>{session.convertTimestamp(tx[0])}</p>
                          )}
                        </td>
                        <td>{tx[1]}</td>
                        {tx[2] < 0 && (
                          <td>
                            <p className="has-text-danger has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        {tx[2] > 0 && (
                          <td>
                            <p className="has-text-right">
                              {session.atomicToHuman(tx[2], true)}
                            </p>
                          </td>
                        )}
                        <td>
                          <p className="has-text-right">
                            {session.atomicToHuman(tx[3], true)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {this.state.transactions.length <
                this.state.totalTransactionCount && (
                <form>
                  <div className="field">
                    <div className="buttons">
                      <button
                        type="submit"
                        className="button is-warning"
                        onClick={this.handleLoadMore.bind(this)}
                      >
                        Load more...
                      </button>
                      <button
                        type="submit"
                        className="button is-danger"
                        onClick={this.resetDefault.bind(this)}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
            <div
              className={
                session.firstLoadOnLogin
                  ? 'footerbar-slideup has-background-black'
                  : 'footerbar has-background-black'
              }
            >
              {' '}
              <div className="field is-grouped is-grouped-multiline is-grouped-right">
                {this.state.nodeFee > 0 && (
                  <div className="control statusicons">
                    <div className="tags has-addons">
                      <span className="tag is-dark is-large">Node Fee:</span>
                      <span className="tag is-danger is-large">
                        {session.atomicToHuman(this.state.nodeFee, true)} TRTL
                      </span>
                    </div>
                  </div>
                )}
                <div className="control statusicons">
                  <div className="tags has-addons">
                    <span className="tag is-dark is-large">Sync:</span>
                    {this.state.syncStatus < 100 &&
                      session.daemon.networkBlockCount !== 0 && (
                        <span className="tag is-warning is-large">
                          {this.state.syncStatus}%
                          <ReactLoading
                            type="bubbles"
                            color="#363636"
                            height={30}
                            width={30}
                          />
                        </span>
                      )}
                    {this.state.syncStatus === 100 &&
                      session.daemon.networkBlockCount !== 0 && (
                        <span className="tag is-success is-large">
                          {this.state.syncStatus}%
                        </span>
                      )}
                    {session.daemon.networkBlockCount === 0 && (
                      <span className="tag is-danger is-large">
                        <ReactLoading
                          type="spinningBubbles"
                          color="#F5F5F5"
                          height={30}
                          width={30}
                        />
                      </span>
                    )}
                  </div>
                </div>
                <div className="control statusicons">
                  <div className="tags has-addons">
                    <span className="tag is-dark is-large">Balance:</span>
                    <span
                      className={
                        this.state.lockedBalance > 0
                          ? 'tag is-warning is-large'
                          : 'tag is-info is-large'
                      }
                      data-tip={balanceTooltip}
                    >
                      {this.state.lockedBalance > 0 ? (
                        <i className="fa fa-lock" />
                      ) : (
                        <i className="fa fa-unlock" />
                      )}
                      &nbsp;
                      {session.atomicToHuman(
                        this.state.unlockedBalance + this.state.lockedBalance,
                        true
                      )}
                      &nbsp;TRTL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
