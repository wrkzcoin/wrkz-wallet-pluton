/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import request from 'request-promise';
import { ipcRenderer, remote } from 'electron';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect } from 'react-router-dom';
import log from 'electron-log';
import { config, session, eventEmitter } from '../index';
import navBar from './NavBar';

function getNodeList() {
  const options = {
    method: 'GET',
    url:
      'https://raw.githubusercontent.com/turtlecoin/turtlecoin-nodes-json/master/turtlecoin-nodes.json'
  };
  // eslint-disable-next-line func-names
  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    return body;
  });
}

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
      nodeList: getNodeList(),
      connectednode: `${session.daemonHost}:${session.daemonPort}`,
      nodeFee: session.daemon.feeAmount,
      changePassword: false,
      loginFailed: false,
      nodeChangeInProgress: false,
      scanHeight: '',
      ssl: session.daemon.ssl,
      wallet: session.wallet,
      gohome: false,
      darkmode: false
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
    const requestOptions = {
      method: 'GET',
      uri: `https://trtl.nodes.pub/api/getNodes`,
      headers: {},
      json: true,
      gzip: true,
      timeout: 5000
    };
    try {
      const result = await request(requestOptions);
      const selectedNode = result[Math.floor(Math.random() * result.length)];

      const connectionString = `${selectedNode.url}:${selectedNode.port}`;
      log.debug(`Found new node: ${connectionString}`);
      this.setState({
        connectednode: connectionString
      });
      return;
    } catch (err) {
      log.debug(err);
    }
  }

  async rescanWallet(event) {
    event.preventDefault();
    let scanHeight = event.target[0].value;
    if (scanHeight === '') {
      scanHeight = 0;
      log.debug(scanHeight);
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
      message: `You are about to rescan your wallet from block ${scanHeight}. Are you sure you want to do this? Rescanning can take a very long time.`
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
      darkmode: true
    })
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
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
    return (
      <div>
        {navBar('settings')}
        <div className="box has-background-light maincontent">
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
                        <button className="button is-warning is-loading">
                          Connect
                        </button>
                      </div>
                    )}
                    {this.state.nodeChangeInProgress === false && (
                      <div className="control">
                        <button className="button is-warning">Connect</button>
                      </div>
                    )}
                  </div>
                </label>
              </form>
              <div className="is-divider" />

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
                        <p className="help">Defaults to 0</p>
                      </div>
                      <div className="control">
                        <button className="button is-danger">Rescan</button>
                      </div>
                    </div>
                  </label>
                </form>
              )}
            </div>
            <div className="column">
              <br />
              <p className="buttons is-right has-text-bold">
                <span>
                Enable dark mode &nbsp;&nbsp;
                  <a className="button  is-dark" onClick={this.darkModeOn}>
                    <span className="icon is-large">
                      <i className="fas fa-moon" />
                    </span>
                  </a>
                </span>
              </p>
            </div>
            <div className="column" />
          </div>
        </div>
        <div className="box has-background-grey-lighter footerbar">
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
                {session.daemon.networkBlockCount === 0 &&
                  session.wallet !== undefined && (
                    <span className="tag is-danger is-large">Node Offline</span>
                  )}
                {session.wallet === undefined && (
                  <span className="tag is-danger is-large">No Wallet Open</span>
                )}
              </div>
            </div>
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-dark is-large">Balance:</span>
                <span className="tag is-info is-large">
                  {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
