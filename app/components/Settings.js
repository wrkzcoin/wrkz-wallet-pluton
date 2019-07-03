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

async function checkIfCacheAPI(host, port) {
  const requestOptions = {
      method: 'GET',
      uri: `http://${host}:${port}/info`,
      headers: {},
      json: true,
      gzip: true
  };
  try {
    const result = await request(requestOptions);
    if (result.isCacheApi == null) {
      log.debug(`${host} is a conventional daemon with no SSL.`)
      return [false, false];
    } else {
      log.debug(`${host} is a cached API with no SSL.`)
      return [true, false];
    }
  } catch (err) {
    log.debug(`Requesting /info from node failed, retrying with SSL...`);
    try {
      const requestOptionsSSL = {
        method: 'GET',
        uri: `https://${host}:${port}/info`,
        headers: {},
        json: true,
        gzip: true
      };
      const resultSSL = await request(requestOptionsSSL);
      if (resultSSL.isCacheApi == null) {
        log.debug(`${host} is a conventional daemon with SSL.`)
        remote.dialog.showMessageBox(null, {
          type: 'error',
          buttons: ['OK'],
          title: 'Node Not Supported',
          message:
            'Unfortunately, proton wallet does not support conventional daemons with SSL at this time. Please select another node. See https://github.com/turtlecoin/turtlecoin-wallet-backend-js/issues/26 for details.'
        });
        return [false, true];
      } else {
        log.debug(`${host} is a cached API with SSL.`)
        return [true, true];
      }
    } catch(errSSL) {
      log.debug(errSSL);
      log.debug('Both requests failed, node is down.')
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Node is Down',
        message:
          'The node you selected does not appear to be responding. Try selecting another node.'
      });
      return [undefined, undefined];
    }
  }
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
      connectednode: `${session.daemonHost}:${
        session.daemonPort
      }`,
      nodeFee: session.daemon.feeAmount,
      changePassword: false,
      loginFailed: false
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
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
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
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
  }

  refreshNodeFee() {
    this.setState({
      nodeFee: session.daemon.feeAmount,
      connectednode: `${session.daemonHost}:${
        session.daemonPort
      }`
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
    this.setState({ connectednode: event.target.value });
  }

  async changeNode(event) {
    event.preventDefault();
    // we're going to trim the whitespace, as well as trim any whitespace in the resulting string splits
    // this is pretty hacky looking but works
    const connectionString = event.target[0].value.trim();
    const splitConnectionString = connectionString.split(':', 2);
    const [host, port] = [
      splitConnectionString[0].trim(),
      splitConnectionString[1].trim()
    ];
    // eslint-disable-next-line eqeqeq
    if (host == session.daemonHost && port == session.daemonPort) {
      return;
    }
    log.debug(`Checking if ${host} is a Cache API or Conventional Daemon...`);
    const [isCache, useSSL] = await checkIfCacheAPI(host, port);
    session.swapNode(host, port, isCache, useSSL);
    this.setState({
      connectednode: connectionString
    })
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

  async findNode(evt, route) {
    const requestOptions = {
      method: 'GET',
      uri: `https://trtl.nodes.pub/api/getNodes`,
      headers: {},
      json: true,
      gzip: true
    };
    try {
      const result = await request(requestOptions);
      const selectedNode = result[Math.floor(Math.random() * result.length)];

      const connectionString = `${selectedNode.url}:${selectedNode.port}`;
      log.debug(`Found new node: ` + connectionString);
      this.setState({
        connectednode: connectionString
      })
      return;
    } catch (err) {
      log.debug(err);
      return;
    }
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
              <form onSubmit={this.changeNode}>
                <label className="label has-text-grey-light">
                  Connected Node (node:port)
                  <div className="field has-addons">
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        value={this.state.connectednode}
                        onChange={this.handleNodeInputChange}
                      />
                      <label className="help"><a onClick={this.findNode}>Find node...</a></label>
                    </div>
                    <div className="control">
                      <button className="button is-warning">Connect</button>
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
                  <span className="tag is-danger is-large">Node Offline</span>
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
