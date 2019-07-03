/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import request from 'request';
import { ipcRenderer } from 'electron';
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
      transactions: session.getTransactions(),
      transactionInProgress: false,
      importkey: false,
      importseed: false,
      nodeList: getNodeList(),
      connectednode: `${session.daemon.daemonHost}:${session.daemon.daemonPort}`,
      nodeFee: session.daemon.feeAmount,
      changePassword: false,
      loginFailed: false

    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handleNewNode = this.handleNewNode.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.on('newNodeConnected', this.handleNewNode);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.off('newNodeConnected', this.handleNewNode);
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
    });
  }

  handleNewNode() {
    // something
    this.setState({
      connectednode: `${session.daemon.daemonHost}:${session.daemon.daemonPort}`
    })
  }


  handlePasswordChange() {
    this.setState({
      changePassword: true
    });
  }

  handleNodeInputChange(event) {
    this.setState({ connectednode: event.target.value });
  }

  changeNode(event) {
    event.preventDefault();
    const connectionString = event.target[0].value;
    const [host, port] = connectionString.split(':', 2);
    log.debug(host, port);
    // eslint-disable-next-line eqeqeq
    if (host == session.daemonHost && port == session.daemonPort) {
      return;
    }
    log.debug(session.walletPassword);
    eventEmitter.emit('initializeNewNode', session.walletPassword, host, port);
  }

  async handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    const [coinbaseScan, autoOptimize] = [
      event.target[0].value, // whether or not to scan coinbase transactions
      event.target[1].value // whether or not to keep wallet auto-optimized
    ];

    log.debug(
      `coinbaseScan = ${coinbaseScan}`,
      `\nautoOptimize = ${autoOptimize}`
    );
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

    return (
      <div>
        {navBar('settings')}
        <div className="box has-background-light maincontent">
          <div className="columns">
            <div className="column">
              <h2 className="subtitle">Node Settings</h2>
              <form onSubmit={this.changeNode}>
                <label className="label has-text-grey-light">
                  Change Node
                  <div className="field has-addons">
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        value={this.state.connectednode}
                        onChange={this.handleNodeInputChange.bind(this)}
                      />
                    </div>
                    <div className="control">
                      <button className="button is-warning">
                        Connect to node...
                      </button>
                    </div>
                  </div>
                </label>
              </form>
            </div>
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
                {this.state.syncStatus < 100 && (
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
                {this.state.syncStatus === 100 && (
                  <span className="tag is-success is-large">
                    {this.state.syncStatus}%
                  </span>
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
