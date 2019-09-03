// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { remote } from 'electron';
import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import log from 'electron-log';
import { session, eventEmitter, il8n, config } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import FiatSelector from './FiatSelector';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  connectednode: string,
  ssl: boolean,
  wallet: any,
  darkMode: boolean,
  scanHeight: string,
  rewindHeight: string,
  nodeChangeInProgress: boolean,
  rewindInProgress: boolean,
  closeToTray: boolean,
  scanCoinbaseTransactions: boolean
};

export default class Settings extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      connectednode: `${session.daemonHost}:${session.daemonPort}`,
      ssl: session.daemon.ssl,
      wallet: session.wallet,
      darkMode: session.darkMode,
      scanHeight: '',
      rewindHeight: '',
      nodeChangeInProgress: false,
      rewindInProgress: false,
      closeToTray: config.closeToTray || false,
      scanCoinbaseTransactions: config.scanCoinbaseTransactions || false
    };
    this.handleNewNode = this.handleNewNode.bind(this);
    this.handleNodeInputChange = this.handleNodeInputChange.bind(this);
    this.findNode = this.findNode.bind(this);
    this.changeNode = this.changeNode.bind(this);
    this.handleNodeChangeInProgress = this.handleNodeChangeInProgress.bind(
      this
    );
    this.handleNodeChangeInProgress = this.handleNodeChangeInProgress.bind(
      this
    );
    this.handleScanHeightChange = this.handleScanHeightChange.bind(this);
    this.rescanWallet = this.rescanWallet.bind(this);
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
    this.closeToTrayOn = this.closeToTrayOn.bind(this);
    this.closeToTrayOff = this.closeToTrayOff.bind(this);
    this.rewindWallet = this.rewindWallet.bind(this);
    this.handleRewindHeightChange = this.handleRewindHeightChange.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('newNodeConnected', this.handleNewNode);
    eventEmitter.on('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.on('nodeChangeComplete', this.handleNodeChangeComplete);
  }

  componentWillUnmount() {
    eventEmitter.off('newNodeConnected', this.handleNewNode);
    eventEmitter.off('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.off('nodeChangeComplete', this.handleNodeChangeComplete);
  }

  handleNodeChangeInProgress = () => {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined
    });
  };

  handleNodeChangeComplete = () => {
    this.setState({
      nodeChangeInProgress: false,
      connectednode: `${session.daemonHost}:${session.daemonPort}`,
      ssl: session.daemon.ssl
    });
  };

  handleNewNode = () => {
    this.setState({
      connectednode: `${session.daemon.daemonHost}:${session.daemon.daemonPort}`
    });
  };

  handleNodeInputChange = (event: any) => {
    this.setState({ connectednode: event.target.value.trim() });
  };

  changeNode = async (event: any) => {
    event.preventDefault();
    this.setState({
      connectednode: event.target[0].value
    });
    const connectionString = event.target[0].value;
    const splitConnectionString = connectionString.split(':', 2);
    const host = splitConnectionString[0];
    let port = splitConnectionString[1];
    if (port === undefined) {
      port = '11898';
    }
    if (
      // eslint-disable-next-line eqeqeq
      host.trim() == session.daemonHost &&
      // eslint-disable-next-line eqeqeq
      port.trim() == session.daemonPort.toString()
    ) {
      return;
    }
    eventEmitter.emit('nodeChangeInProgress');
    session.swapNode(host, port);
    eventEmitter.emit('initializeNewNode', session.walletPassword, host, port);
  };

  findNode = () => {
    remote.shell.openExternal('https://explorer.turtlecoin.lol/nodes.html');
  };

  rescanWallet = async (event: any) => {
    event.preventDefault();
    let fromStartHeight = false;
    let scanHeight = event.target[0].value;
    if (scanHeight === '') {
      scanHeight = parseInt(session.wallet.walletSynchronizer.startHeight, 10);
      fromStartHeight = true;
    } else {
      scanHeight = parseInt(event.target[0].value, 10);
    }
    if (Number.isNaN(scanHeight)) {
      log.debug('User provided invalid height.');
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: il8n.not_a_valid_number,
        message: il8n.please_enter_valid_number
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
          ? `${il8n.about_to_rescan_beginning} ${scanHeight} ${
              il8n.about_to_rescan_end_1
            }`
          : `${il8n.about_to_rescan_beginning} ${scanHeight} ${
              il8n.about_to_rescan_end_2
            }`
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
      title: `${il8n.reset_complete}`,
      message: `${il8n.syncing_again_from}${scanHeight}.`
    });
  };

  handleScanHeightChange = (event: any) => {
    this.setState({ scanHeight: event.target.value.trim() });
  };

  closeToTrayOn = () => {
    this.setState({
      closeToTray: true
    });
    session.toggleCloseToTray(true);
    const userSelection = remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Yes', 'No'],
      title: il8n.title_restart_required,
      message: il8n.restart_required
    });
    if (userSelection === 0) {
      if (process.env.NODE_ENV === 'development') {
        log.debug(`Can't relaunch appliation while in dev mode.`);
        return;
      }
      remote.app.relaunch();
      remote.app.exit();
    }
  };

  closeToTrayOff = () => {
    this.setState({
      closeToTray: false
    });
    session.toggleCloseToTray(false);
    const userSelection = remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Yes', 'No'],
      title: `Restart Required`,
      message: `To change this setting, an application restart is required. Would you like to restart now?`
    });
    if (userSelection === 0) {
      if (process.env.NODE_ENV === 'development') {
        log.debug(`Can't relaunch appliation while in dev mode.`);
        return;
      }
      remote.app.relaunch();
      remote.app.exit();
    }
  };

  darkModeOn = () => {
    this.setState({
      darkMode: true
    });
    session.darkMode = true;
    session.toggleDarkMode(true);
    eventEmitter.emit('darkmodeon');
  };

  darkModeOff = () => {
    this.setState({
      darkMode: false
    });
    session.darkMode = false;
    session.toggleDarkMode(false);
    eventEmitter.emit('darkmodeoff');
  };

  scanCoinbaseTransactionsOn = () => {
    session.modifyConfig('scanCoinbaseTransactions', true);
    this.setState({
      scanCoinbaseTransactions: true
    });
    eventEmitter.emit('scanCoinbaseTransactionsOn');
  };

  scanCoinbaseTransactionsOff = () => {
    session.modifyConfig('scanCoinbaseTransactions', false);
    this.setState({
      scanCoinbaseTransactions: false
    });
    eventEmitter.emit('scanCoinbaseTransactionsOff');
  };

  rewindWallet = async (event: any) => {
    event.preventDefault();
    this.setState({
      rewindInProgress: true
    });
    const rewindHeight = parseInt(event.target[0].value, 10);
    if (Number.isNaN(rewindHeight)) {
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
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: `${il8n.rewind_complete}`,
      message: ` ${il8n.has_been_rewound_beginning}${rewindHeight}${
        il8n.has_been_rewound_end
      }`
    });
  };

  handleRewindHeightChange = (event: any) => {
    const rewindHeight = event.target.value.trim();
    this.setState({ rewindHeight });
  };

  render() {
    const {
      darkMode,
      nodeChangeInProgress,
      connectednode,
      ssl,
      wallet,
      rewindHeight,
      rewindInProgress,
      scanHeight,
      closeToTray,
      scanCoinbaseTransactions
    } = this.state;

    const { backgroundColor, textColor, linkColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            effect="solid"
            border
            type="light"
            multiline
            place="top"
          />
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <div className="columns">
              <div className="column">
                <form onSubmit={this.changeNode}>
                  <p className={`has-text-weight-bold ${textColor}`}>
                    {il8n.connected_node}
                  </p>
                  <div className="field has-addons is-expanded">
                    <div className="control is-expanded has-icons-left">
                      {nodeChangeInProgress === false && (
                        <input
                          className="input has-icons-left"
                          type="text"
                          value={connectednode}
                          onChange={this.handleNodeInputChange}
                        />
                      )}
                      {ssl === true && (
                        <span className="icon is-small is-left">
                          <i className="fas fa-lock" />
                        </span>
                      )}
                      {ssl === false && (
                        <span className="icon is-small is-left">
                          <i className="fas fa-unlock" />
                        </span>
                      )}
                      {nodeChangeInProgress === true && (
                        <input
                          className="input"
                          type="text"
                          placeholder="connecting..."
                          onChange={this.handleNodeInputChange}
                        />
                      )}
                      {nodeChangeInProgress === true && (
                        <span className="icon is-small is-left">
                          <i className="fas fa-sync fa-spin" />
                        </span>
                      )}
                      <p className="help">
                        <a
                          onClick={this.findNode}
                          onKeyPress={this.findNode}
                          role="button"
                          tabIndex={0}
                          className={linkColor}
                          onMouseDown={event => event.preventDefault()}
                        >
                          {il8n.find_node}
                        </a>
                      </p>
                    </div>
                    {nodeChangeInProgress === true && (
                      <div className="control">
                        <button className="button is-success is-loading">
                          {il8n.connect}
                        </button>
                      </div>
                    )}
                    {nodeChangeInProgress === false && (
                      <div className="control">
                        <button className="button is-success">
                          {il8n.connect}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
                <br />
                {wallet && (
                  <form
                    onSubmit={this.rewindWallet}
                    data-tip={il8n.rewind_wallet_help}
                  >
                    <p className={`has-text-weight-bold ${textColor}`}>
                      {il8n.rewind_wallet}
                    </p>
                    <div className="field has-addons">
                      <div className="control is-expanded">
                        <input
                          className="input"
                          type="text"
                          placeholder="Enter a height to scan from..."
                          value={rewindHeight}
                          onChange={this.handleRewindHeightChange}
                        />
                      </div>
                      <div className="control">
                        <button
                          className={
                            rewindInProgress
                              ? 'button is-warning is-loading'
                              : 'button is-warning'
                          }
                        >
                          {il8n.rewind}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                <br />
                <br />
                {wallet && (
                  <form
                    onSubmit={this.rescanWallet}
                    data-tip={il8n.rescan_wallet_help}
                  >
                    <p className={`has-text-weight-bold ${textColor}`}>
                      {il8n.rescan_wallet}
                    </p>
                    <div className="field has-addons">
                      <div className="control is-expanded">
                        <input
                          className="input"
                          type="text"
                          placeholder="Enter a height to scan from..."
                          value={scanHeight}
                          onChange={this.handleScanHeightChange}
                        />
                      </div>
                      <div className="control">
                        <button className="button is-danger">
                          {il8n.rescan}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
              <div className="column">
                <p className={`has-text-weight-bold ${textColor}`}>
                  Alternate Display Currency:
                </p>
                <FiatSelector />
              </div>
              <div className="column">
                <br />
                <p className="buttons is-right">
                  {darkMode === true && (
                    <span className={textColor}>
                      {il8n.enable_light_mode} &nbsp;&nbsp;
                      <a
                        className="button is-info"
                        onClick={this.darkModeOff}
                        onKeyPress={this.darkModeOff}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="icon is-large has-text-warning">
                          <i className="fas fa-sun" />
                        </span>
                      </a>
                    </span>
                  )}
                  {darkMode === false && (
                    <span>
                      {il8n.enable_dark_mode} &nbsp;&nbsp;
                      <a
                        className="button is-dark"
                        onClick={this.darkModeOn}
                        onKeyPress={this.darkModeOn}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="icon is-large">
                          <i className="fas fa-moon" />
                        </span>
                      </a>
                    </span>
                  )}
                  <br />
                  <br />
                  {closeToTray === false && (
                    <span className={textColor}>
                      {il8n.enable_close_to_tray} &nbsp;&nbsp;
                      <a
                        className="button is-success"
                        onClick={this.closeToTrayOn}
                        onKeyPress={this.closeToTrayOn}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="icon is-large">
                          <i className="fas fa-check" />
                        </span>
                      </a>
                    </span>
                  )}
                  {closeToTray === true && (
                    <span className={textColor}>
                      {il8n.disable_close_to_tray} &nbsp;&nbsp;
                      <a
                        className="button is-danger"
                        onClick={this.closeToTrayOff}
                        onKeyPress={this.closeToTrayOff}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="icon is-large">
                          <i className="fa fa-times" />
                        </span>
                      </a>
                    </span>
                  )}
                  <br />
                  <br />
                  {scanCoinbaseTransactions === false && (
                    <span className={textColor}>
                      Enable scanning coinbase transactions &nbsp;&nbsp;
                      <a
                        className="button is-success"
                        onClick={this.scanCoinbaseTransactionsOn}
                        onKeyPress={this.scanCoinbaseTransactionsOn}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="icon is-large">
                          <i className="fas fa-check" />
                        </span>
                      </a>
                    </span>
                  )}
                  {scanCoinbaseTransactions === true && (
                    <span className={textColor}>
                      Disable scanning coinbase transactions &nbsp;&nbsp;
                      <a
                        className="button is-danger"
                        onClick={this.scanCoinbaseTransactionsOff}
                        onKeyPress={this.scanCoinbaseTransactionsOff}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="icon is-large">
                          <i className="fa fa-times" />
                        </span>
                      </a>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
