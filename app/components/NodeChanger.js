// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { remote } from 'electron';
import { il8n, session, eventEmitter, config } from '../index';
import child from 'child_process';
import uiType from '../utils/uitype';

type Props = {
  darkMode: boolean
};

type State = {
  connectednode: string,
  nodeChangeInProgress: boolean,
  ssl: boolean,
  useLocalDaemon: boolean,
  turtleCoindPath: string
};

export default class NodeChanger extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      connectednode: `${session.daemonHost}:${session.daemonPort}`,
      nodeChangeInProgress: false,
      ssl: session.daemon.ssl,
      useLocalDaemon: config.useLocalDaemon,
      turtleCoindPath: config.turtleCoindPath
    };
    this.changeNode = this.changeNode.bind(this);
    this.handleNodeInputChange = this.handleNodeInputChange.bind(this);
    this.handleNewNode = this.handleNewNode.bind(this);
    this.handleNodeChangeInProgress = this.handleNodeChangeInProgress.bind(
      this
    );
    this.handleNodeChangeComplete = this.handleNodeChangeComplete.bind(this);
    this.toggleLocalDaemon = this.toggleLocalDaemon.bind(this);
    this.browseForTurtleCoind = this.browseForTurtleCoind.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('newNodeConnected', this.handleNewNode);
    eventEmitter.on('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.on('nodeChangeComplete', this.handleNodeChangeComplete);
  }

  componentWillUnmount() {
    eventEmitter.off('newNodeConnected', this.handleNewNode);
    eventEmitter.off('nodeChangeInProgress', this.handleNodeChangeInProgress);
    eventEmitter.off('nodeChangeComplete', this.handleNodeChangeComplete);
  }

  browseForTurtleCoind = () => {
    const options = {
      defaultPath: remote.app.getPath('documents')
    };
    const getPaths = remote.dialog.showOpenDialog(null, options);
    if (getPaths === undefined) {
      return;
    }
    this.setState({
      turtleCoindPath: getPaths[0]
    });

    session.modifyConfig('turtleCoindPath', getPaths[0]);
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

  handleNodeInputChange = (event: any) => {
    this.setState({ connectednode: event.target.value.trim() });
  };

  handleNewNode = () => {
    this.setState({
      connectednode: `${session.daemon.daemonHost}:${session.daemon.daemonPort}`
    });
  };

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

  toggleLocalDaemon = () => {
    const { darkMode } = this.props;
    const { useLocalDaemon } = this.state;
    const { textColor } = uiType(darkMode);

    session.modifyConfig('useLocalDaemon', !useLocalDaemon);
    this.setState({
      useLocalDaemon: !useLocalDaemon
    });

    const message = (
      <div>
        <center>
          <p className={`subtitle ${textColor}`}>Restart Required!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          In order to change this setting, an application restart is required.
          Would you like to restart now?
        </p>
      </div>
    );
    eventEmitter.emit(
      'openModal',
      message,
      'Restart',
      `Not Right Now`,
      'restartApplication'
    );
  };

  render() {
    const { darkMode } = this.props;
    const { textColor, linkColor } = uiType(darkMode);
    const {
      nodeChangeInProgress,
      connectednode,
      ssl,
      useLocalDaemon,
      turtleCoindPath
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
                disabled={useLocalDaemon}
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
                disabled={useLocalDaemon}
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
                disabled={useLocalDaemon}
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
              <button
                className="button is-success is-loading"
                disabled={useLocalDaemon}
              >
              <span class="icon is-small">
              <i class="fa fa-network-wired" />
            </span>&nbsp;&nbsp;{il8n.connect}
              </button>
            </div>
          )}
          {nodeChangeInProgress === false && (
            <div className="control">
              <button className="button is-success" disabled={useLocalDaemon}>
              <span class="icon is-small">
              <i class="fa fa-network-wired" />
            </span>&nbsp;&nbsp;{il8n.connect}
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
            >
              <span className="icon is-large">
                <i className="fas fa-times" />
              </span>
            </a>
            &nbsp;&nbsp; Use Local Daemon: <b>Off</b>
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
            >
              <span className="icon is-large">
                <i className="fa fa-check" />
              </span>
            </a>
            &nbsp;&nbsp; Use Local Daemon: <b>On</b> &nbsp;&nbsp;
          </span>
        )}
        <br />
        <br />
        <p className={`has-text-weight-bold ${textColor}`}>
          TurtleCoind location:
        </p>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              value={turtleCoindPath}
              readOnly
            />
          </div>
          <div className="control">
            <button
              className="button is-warning"
              onClick={this.browseForTurtleCoind}
            >
              <span class="icon is-small">
                <i class="fas fa-folder-open" />
              </span>
              &nbsp;&nbsp;Browse
            </button>
          </div>
        </div>
      </form>
    );
  }
}
