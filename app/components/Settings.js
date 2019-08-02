// @flow
import request from 'request-promise';
import { ipcRenderer, remote } from 'electron';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import log from 'electron-log';
import { session, eventEmitter } from '../index';
import navBar from './NavBar';
import BottomBar from './BottomBar';


type Props = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>,
  handleSubmit: () => void,
  transactionInProgress: boolean,
  importseed: boolean,
  importkey: boolean,
  nodeList: Array<string>
};

export default class Settings extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactionInProgress: false,
      importkey: false,
      importseed: false,
      connectednode: `${session.daemonHost}:${session.daemonPort}`,
      nodeFee: session.daemon.feeAmount,
      changePassword: false,
      loginFailed: false,
      nodeChangeInProgress: false,
      scanHeight: '',
      ssl: session.daemon.ssl,
      wallet: session.wallet,
      gohome: false,
      darkMode: session.darkMode,
      rewindHeight: '',
      rewindInProgress: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handleNewNode = this.handleNewNode.bind(this);
    this.handleNodeInputChange = this.handleNodeInputChange.bind(this);
    this.refreshNodeFee = this.refreshNodeFee.bind(this);
    this.findNode = this.findNode.bind(this);
    this.changeNode = this.changeNode.bind(this);
    this.handleNodeChangeInProgress = this.handleNodeChangeInProgress.bind(
      this
    );
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(
      this
    );
    this.handleScanHeightChange = this.handleScanHeightChange.bind(this);
    this.rescanWallet = this.rescanWallet.bind(this);
    this.handleInitialize = this.handleInitialize.bind(this);
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
    this.rewindWallet = this.rewindWallet.bind(this);
    this.handleRewindHeightChange = this.handleRewindHeightChange.bind(this);
  }

  componentDidMount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
    this.interval = setInterval(() => this.refresh(), 1000);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.on('newNodeConnected', this.handleNewNode);
    eventEmitter.on('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.on('openNewWallet', this.handleInitialize);
  }

  componentWillUnmount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.off('newNodeConnected', this.handleNewNode);
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
    eventEmitter.off('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.off('openNewWallet', this.handleInitialize);
  }

  handleInitialize() {
    this.setState({
      gohome: true
    });
  }

  refreshBalanceOnNewTransaction() {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
    });
  }

  refreshNodeFee() {
    this.setState({
      nodeFee: session.daemon.feeAmount,
      connectednode: `${session.daemonHost}:${session.daemonPort}`,
      nodeChangeInProgress: false,
      ssl: session.daemon.ssl
    });
  }

  handleNodeChangeInProgress() {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined
    });
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
    });
  }

  handleNewNode() {
    this.setState({
      connectednode: `${session.daemon.daemonHost}:${session.daemon.daemonPort}`
    });
  }

  handlePasswordChange() {
    this.setState({
      changePassword: true
    });
  }

  handleNodeInputChange(event) {
    this.setState({ connectednode: event.target.value.trim() });
  }

  async changeNode(event) {
    event.preventDefault();
    this.setState({
      connectednode: event.target[0].value
    });
    const connectionString = event.target[0].value;
    const splitConnectionString = connectionString.split(':', 2);
    let [host, port] = [splitConnectionString[0], splitConnectionString[1]];
    if (port === undefined) {
      port = '11898';
    }
    if (
      // eslint-disable-next-line eqeqeq
      host.trim() == session.daemonHost &&
      // eslint-disable-next-line eqeqeq
      port.trim() == session.daemonPort
    ) {
      return;
    }
    eventEmitter.emit('nodeChangeInProgress');
    session.swapNode(host, port);
    eventEmitter.emit('initializeNewNode', session.walletPassword, host, port);
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

  async findNode(evt, route) {
    remote.shell.openExternal('https://trtl.nodes.pub/');
  }

  async rescanWallet(event) {
    event.preventDefault();
    let fromStartHeight = false;
    let scanHeight = event.target[0].value;
    if (scanHeight === '') {
      scanHeight = parseInt(session.wallet.walletSynchronizer.startHeight, 10);
      fromStartHeight = true;
    } else {
      scanHeight = parseInt(event.target[0].value, 10);
    }
    if (isNaN(scanHeight)) {
      log.debug('User provided invalid height.');
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Not a valid number',
        message: `Please input a valid block height.`
      });
      this.setState({
        scanHeight: ''
      });
      return;
    }
    const userConfirm = remote.dialog.showMessageBox(null, {
      type: 'warning',
      buttons: ['Cancel', 'OK'],
      title: 'This could take a while...',
      message:
        fromStartHeight === true
          ? `You are about to resan your wallet from block ${scanHeight}, which is the original start height of your wallet. Are you sure you want to do this? Rescanning can take a very long time.`
          : `You are about to rescan your wallet from block ${scanHeight}. Are you sure you want to do this? Rescanning can take a very long time.`
    });
    if (userConfirm !== 1) {
      return;
    }
    log.debug(`Resetting wallet from block ${scanHeight}`);
    this.setState({
      scanHeight: ''
    });
    await session.wallet.reset(scanHeight);
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: 'Reset completed successfully.',
      message: `Your wallet is now syncing again from block ${scanHeight}.`
    });
  }

  handleScanHeightChange(event) {
    this.setState({ scanHeight: event.target.value.trim() });
  }

  darkModeOn() {
    this.setState({
      darkMode: true
    });
    session.darkMode = true;
    session.toggleDarkMode(true);
    eventEmitter.emit('darkmodeon');
  }

  darkModeOff() {
    this.setState({
      darkMode: false
    });
    session.darkMode = false;
    session.toggleDarkMode(false);
    eventEmitter.emit('darkmodeoff');
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
    ReactTooltip.rebuild();
  }

  async rewindWallet(evt) {
    evt.preventDefault();
    this.setState({
      rewindInProgress: true
    });
    let rewindHeight = parseInt(evt.target[0].value, 10);
    if (isNaN(rewindHeight)) {
      this.setState({
        rewindInProgress: false
      });
      return;
    }
    await session.wallet.rewind(rewindHeight);
    this.setState({
      rewindInProgress: false,
      rewindHeight: ''
    });
  }

  handleRewindHeightChange(event) {
    const rewindHeight = event.target.value.trim();
    this.setState({ rewindHeight: rewindHeight });
  }

  render() {
    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }
    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }
    if (this.state.changePassword === true) {
      return <Redirect to="/changepassword" />;
    }
    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }
    if (this.state.gohome === true) {
      return <Redirect to="/" />;
    }

    const balanceTooltip =
      `Unlocked: ${session.atomicToHuman(
        this.state.unlockedBalance,
        true
      )} TRTL<br>` +
      `Locked:  ${session.atomicToHuman(this.state.lockedBalance, true)} TRTL`;

    const syncTooltip =
      session.wallet.getSyncStatus()[2] === 0
        ? 'Connecting, please wait...'
        : `${session.wallet.getSyncStatus()[0]}/${
            session.wallet.getSyncStatus()[2]
          }`;

    return (
      <div>
        {this.state.darkMode === false && (
          <div className="wholescreen">
            <ReactTooltip
              effect="solid"
              border
              type="dark"
              multiline
              place="top"
            />
            {navBar('settings', false)}
            <div className="maincontent">
              <div className="columns">
                <div className="column">
                  <form onSubmit={this.changeNode}>
                    <label className="label">
                      Connected Node (node:port)
                      <div className="field has-addons is-expanded">
                        <div className="control is-expanded has-icons-left">
                          {this.state.nodeChangeInProgress === false && (
                            <input
                              className="input has-icons-left"
                              type="text"
                              value={this.state.connectednode}
                              onChange={this.handleNodeInputChange}
                            />
                          )}
                          {this.state.ssl === true && (
                            <span className="icon is-small is-left">
                              <i className="fas fa-lock" />
                            </span>
                          )}
                          {this.state.ssl === false && (
                            <span className="icon is-small is-left">
                              <i className="fas fa-unlock" />
                            </span>
                          )}
                          {this.state.nodeChangeInProgress === true && (
                            <input
                              className="input"
                              type="text"
                              placeholder="connecting..."
                              onChange={this.handleNodeInputChange}
                            />
                          )}
                          {this.state.nodeChangeInProgress === true && (
                            <span className="icon is-small is-left">
                              <i className="fas fa-sync fa-spin" />
                            </span>
                          )}
                          <label className="help">
                            <p>
                              <a onClick={this.findNode}>Find node...</a>
                            </p>
                          </label>
                        </div>
                        {this.state.nodeChangeInProgress === true && (
                          <div className="control">
                            <button className="button is-success is-loading">
                              Connect
                            </button>
                          </div>
                        )}
                        {this.state.nodeChangeInProgress === false && (
                          <div className="control">
                            <button className="button is-success">
                              Connect
                            </button>
                          </div>
                        )}
                      </div>
                    </label>
                  </form>
                  <br />
                  {this.state.wallet && (
                    <form onSubmit={this.rewindWallet}>
                      <label className="label">
                        Rewind Wallet
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input
                              className="input"
                              type="text"
                              placeholder="Enter a height to scan from..."
                              value={this.state.rewindHeight}
                              onChange={this.handleRewindHeightChange}
                            />
                            <p className="help">
                              Rewinds wallet, keeping previous transactions, to
                              a block height and picks up scanning from there.
                            </p>
                          </div>
                          <div className="control">
                            <button
                              className={
                                this.state.rewindInProgress
                                  ? 'button is-warning is-loading'
                                  : 'button is-warning'
                              }
                            >
                              Rewind
                            </button>
                          </div>
                        </div>
                      </label>
                    </form>
                  )}
                  <br />
                  {this.state.wallet && (
                    <form onSubmit={this.rescanWallet}>
                      <label className="label">
                        Rescan Wallet
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input
                              className="input"
                              type="text"
                              placeholder="Enter a height to scan from..."
                              value={this.state.scanHeight}
                              onChange={this.handleScanHeightChange}
                            />
                            <p className="help">
                              Completely wipes all transactions from history and
                              rescans the wallet from the specified block. If
                              left blank, defaults to the last block wallet was
                              scanned from.
                            </p>
                          </div>
                          <div className="control">
                            <button className="button is-danger">Rescan</button>
                          </div>
                        </div>
                      </label>
                    </form>
                  )}
                </div>
                <div className="column" />
                <div className="column">
                  <br />
                  <p className="buttons is-right">
                    <span>
                      Enable dark mode &nbsp;&nbsp;
                      <a className="button is-dark" onClick={this.darkModeOn}>
                        <span className="icon is-large">
                          <i className="fas fa-moon" />
                        </span>
                      </a>
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <BottomBar />
          </div>
        )}
        {this.state.darkMode === true && (
          <div className="wholescreen has-background-dark">
            <ReactTooltip
              effect="solid"
              border
              type="light"
              multiline
              place="top"
            />
            {navBar('settings', true)}
            <div className="maincontent has-background-dark">
              <div className="columns">
                <div className="column">
                  <form onSubmit={this.changeNode}>
                    <label className="label has-text-white">
                      Connected Node (node:port)
                      <div className="field has-addons is-expanded">
                        <div className="control is-expanded has-icons-left">
                          {this.state.nodeChangeInProgress === false && (
                            <input
                              className="input has-icons-left"
                              type="text"
                              value={this.state.connectednode}
                              onChange={this.handleNodeInputChange}
                            />
                          )}
                          {this.state.ssl === true && (
                            <span className="icon is-small is-left">
                              <i className="fas fa-lock" />
                            </span>
                          )}
                          {this.state.ssl === false && (
                            <span className="icon is-small is-left">
                              <i className="fas fa-unlock" />
                            </span>
                          )}
                          {this.state.nodeChangeInProgress === true && (
                            <input
                              className="input"
                              type="text"
                              placeholder="connecting..."
                              onChange={this.handleNodeInputChange}
                            />
                          )}
                          {this.state.nodeChangeInProgress === true && (
                            <span className="icon is-small is-left">
                              <i className="fas fa-sync fa-spin" />
                            </span>
                          )}
                          <label className="help has-text-white">
                            <p>
                              <a onClick={this.findNode}>Find node...</a>
                            </p>
                          </label>
                        </div>
                        {this.state.nodeChangeInProgress === true && (
                          <div className="control">
                            <button className="button is-success is-loading">
                              Connect
                            </button>
                          </div>
                        )}
                        {this.state.nodeChangeInProgress === false && (
                          <div className="control">
                            <button className="button is-success">
                              Connect
                            </button>
                          </div>
                        )}
                      </div>
                    </label>
                  </form>
                  <br />
                  {this.state.wallet && (
                    <form onSubmit={this.rewindWallet}>
                      <label className="label has-text-white">
                        Rewind Wallet
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input
                              className="input"
                              type="text"
                              placeholder="Enter a height to scan from..."
                              value={this.state.rewindHeight}
                              onChange={this.handleRewindHeightChange}
                            />
                            <p className="help">
                              Rewinds wallet, keeping previous transactions, to
                              a block height and picks up scanning from there.
                            </p>
                          </div>
                          <div className="control">
                            <button
                              className={
                                this.state.rewindInProgress
                                  ? 'button is-warning is-loading'
                                  : 'button is-warning'
                              }
                            >
                              {' '}
                              Rewind
                            </button>
                          </div>
                        </div>
                      </label>
                    </form>
                  )}
                  <br />
                  {this.state.wallet && (
                    <form onSubmit={this.rescanWallet}>
                      <label className="label has-text-white">
                        Rescan Wallet
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input
                              className="input"
                              type="text"
                              placeholder="Enter a height to scan from..."
                              value={this.state.scanHeight}
                              onChange={this.handleScanHeightChange}
                            />
                            <p className="help">
                              Completely wipes all transactions from history and
                              rescans the wallet from the specified block. If
                              left blank, defaults to the last block wallet was
                              scanned from.
                            </p>
                          </div>
                          <div className="control">
                            <button className="button is-danger">Rescan</button>
                          </div>
                        </div>
                      </label>
                    </form>
                  )}
                </div>
                <div className="column" />
                <div className="column">
                  <br />
                  <p className="buttons is-right">
                    <span className="has-text-white">
                      Enable light mode &nbsp;&nbsp;
                      <a className="button is-info" onClick={this.darkModeOff}>
                        <span className="icon is-large has-text-warning">
                          <i className="fas fa-sun" />
                        </span>
                      </a>
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <BottomBar />
          </div>
        )}
      </div>
    );
  }
}
