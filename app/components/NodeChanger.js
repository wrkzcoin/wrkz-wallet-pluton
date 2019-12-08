// Copyright (C) 2019 ExtraHash
// Copyright (C) 2019, WrkzCoin
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import Select from 'react-select';
import { remote } from 'electron';
import log from 'electron-log';
import { Daemon } from 'turtlecoin-wallet-backend';
import {
  il8n,
  session,
  eventEmitter,
  config,
  stopTail,
  startTail
} from '../index';
import uiType from '../utils/uitype';

import NodeFee from './NodeFee';
import Configure from '../Configure';

type Props = {
  darkMode: boolean
};

type State = {
  connectednode: string,
  nodeChangeInProgress: boolean,
  ssl: boolean,
  useLocalDaemon: boolean,
  daemonLogPath: string,
  Selected_Node: string,
  node_NewFee: number
};

export default class NodeChanger extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.daemonInfo =
      session && session.wallet ? session.wallet.getDaemonConnectionInfo() : '';
    this.daemonFee =
      session && session.wallet ? session.wallet.getNodeFee() : '';
    this.state = {
      connectednode: `${this.daemonInfo.host}:${this.daemonInfo.port}`,
      nodeChangeInProgress: false,
      ssl: this.daemonInfo.ssl,
      useLocalDaemon: config.useLocalDaemon,
      daemonLogPath: config.daemonLogPath,
      Selected_Node: Configure.defaultDaemon,
      Fee: this.daemonFee.nodeFeeAmount
    };
    this.changeNode = this.changeNode.bind(this);
    this.handleNodeInputChange = this.handleNodeInputChange.bind(this);
    this.handleNewNode = this.handleNewNode.bind(this);
    this.handleNodeListChange = this.handleNodeListChange.bind(this);
    this.handleNodeChangeInProgress = this.handleNodeChangeInProgress.bind(
      this
    );
    this.handleNodeChangeComplete = this.handleNodeChangeComplete.bind(this);
    this.toggleLocalDaemon = this.toggleLocalDaemon.bind(this);
    this.browseForWrkzd = this.browseForWrkzd.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('newNodeConnected', this.handleNewNode);
    eventEmitter.on('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.on('nodeChangeComplete', this.handleNodeChangeComplete);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
  }

  componentWillUnmount() {
    eventEmitter.off('newNodeConnected', this.handleNewNode);
    eventEmitter.off('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.off('nodeChangeComplete', this.handleNodeChangeComplete);
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
  }

  refreshNodeFee = () => {
    NodeFee.nodeFee = session.daemon.feeAmount
  };

  browseForWrkzd = () => {
    const options = {
      defaultPath: remote.app.getPath('documents')
    };
    const getPaths = remote.dialog.showOpenDialog(null, options);
    if (getPaths === undefined) {
      return;
    }
    this.setState({
      daemonLogPath: getPaths[0]
    });

    session.modifyConfig('daemonLogPath', getPaths[0]);
  };

  changeNode = async (event: any) => {
    event.preventDefault();
    this.setState({
      connectednode: event.target[0].value
    });
    const connectionString = event.target[0].value;
    // eslint-disable-next-line prefer-const
    let [host, port] = connectionString.split(':', 2);
    if (port === undefined) {
      port = Configure.DefaultDaemonRPCPort;
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
    const daemon = new Daemon(host, Number(port));
    await session.wallet.swapNode(daemon);
    session.daemon = daemon;
    eventEmitter.emit('newNodeConnected');
    const daemonInfo = session.wallet.getDaemonConnectionInfo();
    log.info(`Connected to ${daemonInfo.host}:${daemonInfo.port}`);
    session.modifyConfig('daemonHost', daemonInfo.host);
    session.modifyConfig('daemonPort', daemonInfo.port);
    //eventEmitter.emit('gotNodeFee');
    //const daemonFee = session.wallet.getNodeFee();
    //log.info(`Got node fee ${daemonFee.nodeFeeAddress}:${daemonFee.nodeFeeAmount}`);
  };

  handleNodeInputChange = (event: any) => {
    this.setState({ connectednode: event.target.value.trim() });
  };

  handleNodeListChange = (selectedOptions, data) => {
    this.setState({ selectedOptions });
    this.setState({ connectednode: selectedOptions.label });
  }

  handleNewNode = async () => {
    const daemonInfo = session.wallet.getDaemonConnectionInfo();
    const daemonFee = await session.wallet.getNodeFee();
    log.info(daemonInfo)
    log.info(daemonFee)
    this.setState({
      nodeChangeInProgress: false,
      connectednode: `${daemonInfo.host}:${daemonInfo.port}`,
      ssl: daemonInfo.ssl,
      Fee: daemonFee.nodeFeeAmount
    });
  };

  handleNodeChangeInProgress = () => {
    this.setState({
      nodeChangeInProgress: true,
      ssl: undefined,
      node_NewFee: undefined
    });
  };

  handleNodeChangeComplete = () => {
    this.setState({
      nodeChangeInProgress: false,
      connectednode: `${session.daemonHost}:${session.daemonPort}`,
      ssl: session.daemon.ssl,
      node_NewFee: daemonFee.nodeFeeAmount || 0
    });
    log.info(`Network Fee ${daemonFee.nodeFeeAmount  || 0}`);
  };

  toggleLocalDaemon = () => {
    const { useLocalDaemon, daemonLogPath } = this.state;

    if (!daemonLogPath) {
      return;
    }

    if (!useLocalDaemon) {
      startTail(daemonLogPath);
    } else {
      stopTail();
    }

    session.modifyConfig('useLocalDaemon', !useLocalDaemon);
    this.setState({
      useLocalDaemon: !useLocalDaemon
    });

    eventEmitter.emit('logLevelChanged');
  };

  render() {
    const { darkMode } = this.props;
    const { textColor, linkColor } = uiType(darkMode);
    const {
      nodeChangeInProgress,
      connectednode,
      ssl,
      useLocalDaemon,
      daemonLogPath,
	  Selected_Node,
	  node_NewFee
    } = this.state;
    return (
      <form onSubmit={this.changeNode}>
        <p className={`has-text-weight-bold ${textColor}`}>
          Remote Node (node:port)
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
			<br />
			<br />
			<p className={`has-text-weight-bold ${textColor}`}>
			  Select a node:
			</p>
			<div style={{width: '350px'}}>
			<Select
			  value={this.state.selectedOptions}
			  onChange={this.handleNodeListChange}
			  options={session.daemons}
			/>
			</div>
          </div>
          {nodeChangeInProgress === true && (
            <div className="control">
              <button className="button is-success is-loading">
                <span className="icon is-small">
                  <i className="fa fa-network-wired" />
                </span>
                &nbsp;&nbsp;{il8n.connect}
              </button>
            </div>
          )}
          {nodeChangeInProgress === false && (
            <div className="control">
              <button className="button is-success">
                <span className="icon is-small">
                  <i className="fa fa-network-wired" />
                </span>
                &nbsp;&nbsp;{il8n.connect}
              </button>
            </div>
          )}
        </div>
        {useLocalDaemon === false && (
          <span className={textColor}>
            <a
              className="button is-danger"
              onClick={this.toggleLocalDaemon}
              onKeyPress={this.toggleLocalDaemon}
              role="button"
              tabIndex={0}
              disabled={!daemonLogPath}
            >
              <span className="icon is-large">
                <i className="fas fa-times" />
              </span>
            </a>
            &nbsp;&nbsp; Tail Local Daemon Log File: <b>Off</b>
          </span>
        )}
        {useLocalDaemon === true && (
          <span className={textColor}>
            <a
              className="button is-success"
              onClick={this.toggleLocalDaemon}
              onKeyPress={this.toggleLocalDaemon}
              role="button"
              tabIndex={0}
              disabled={!daemonLogPath}
            >
              <span className="icon is-large">
                <i className="fa fa-check" />
              </span>
            </a>
            &nbsp;&nbsp; Tail Local Daemon Log File: <b>On</b> &nbsp;&nbsp;
          </span>
        )}
        <br />
        <br />
        <p className={`has-text-weight-bold ${textColor}`}>
          Wrkzd.log file location:
        </p>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              value={daemonLogPath}
              readOnly
            />
          </div>
          <div className="control">
            <button
              className="button is-warning"
              onClick={this.browseForWrkzd}
            >
              <span className="icon is-small">
                <i className="fas fa-folder-open" />
              </span>
              &nbsp;&nbsp;Browse
            </button>
          </div>
        </div>
      </form>
    );
  }
}
