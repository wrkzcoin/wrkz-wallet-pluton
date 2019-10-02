// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { remote } from 'electron';
import ReactTooltip from 'react-tooltip';
import {
  session,
  daemonLogger,
  eventEmitter,
  loginCounter,
  config
} from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  darkMode: boolean,
  daemonLog: string[],
  pageAnimationIn: string,
  backendLog: string[],
  selectedLog: string
};

export default class Receive extends Component<Props, State> {
  props: Props;

  state: State;

  daemonLog: string[];

  terminalEnd: any;

  constructor(props?: Props) {
    super(props);
    this.daemonLog = daemonLogger ? daemonLogger.daemonLog : [];
    const { darkMode } = session;

    this.state = {
      darkMode,
      daemonLog: this.daemonLog,
      backendLog: session.backendLog,
      pageAnimationIn: loginCounter.getAnimation('/terminal'),
      selectedLog: loginCounter.selectedLog
    };

    this.refreshConsole = this.refreshConsole.bind(this);
    this.setActiveLog = this.setActiveLog.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('refreshConsole', this.refreshConsole);
    eventEmitter.on('refreshBackendLog', this.refreshBackendLog);
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  componentWillUnmount() {
    eventEmitter.off('refreshConsole', this.refreshConsole);
    eventEmitter.off('refreshBackendLog', this.refreshBackendLog);

    const { selectedLog } = this.state;
    loginCounter.selectedLog = selectedLog;
  }

  scrollToBottom = () => {
    this.terminalEnd.scrollIntoView();
  };

  refreshConsole = () => {
    if (daemonLogger) {
      const { daemonLog } = daemonLogger;
      this.setState({
        daemonLog
      });
    }
  };

  refreshBackendLog = () => {
    const { backendLog } = session;
    this.setState({
      backendLog
    });
  };

  setActiveLog = (selectedLog: string) => {
    this.setState({
      selectedLog
    });
    this.scrollToBottom();
  };

  render() {
    const {
      darkMode,
      daemonLog,
      backendLog,
      pageAnimationIn,
      selectedLog
    } = this.state;
    const { backgroundColor, textColor, fillColor, toolTipColor } = uiType(
      darkMode
    );

    // note: the css uses flexbox to reverse this DIV (it treats the top as the bottom)
    return (
      <div>
        <Redirector />
        <ReactTooltip
          effect="solid"
          type={toolTipColor}
          multiline
          place="top"
        />
        <div className={`wholescreen ${backgroundColor} hide-scrollbar`}>
          <NavBar darkMode={darkMode} />
          <div
            className={`maincontent ${fillColor} ${textColor} ${pageAnimationIn}`}
          >
            <div className="columns">
              <div className="column is-one-fifth">
                <aside className="menu log-menu">
                  <ul className="menu-list">
                    <li>
                      <a
                        className="menu-link-light"
                        onClick={() => this.setActiveLog('wallet-backend')}
                        onKeyPress={() => this.setActiveLog('wallet-backend')}
                        role="button"
                        tabIndex={0}
                        onMouseDown={event => event.preventDefault()}
                      >
                        WalletBackend
                      </a>
                    </li>
                    {config.useLocalDaemon && (
                      <li>
                        <a
                          className="menu-link-light"
                          onClick={() => this.setActiveLog('daemon')}
                          onKeyPress={() => this.setActiveLog('daemon')}
                          role="button"
                          tabIndex={0}
                          onMouseDown={event => event.preventDefault()}
                        >
                          TurtleCoind
                        </a>
                      </li>
                    )}
                  </ul>
                </aside>
              </div>
              <div className="column terminal" id="terminal">
                {false && (
                  <input
                    className="bash-prompt has-text-weight-bold has-icons-left has-text-success is-family-monospace"
                    ref={input => input && input.focus()}
                    type="text"
                  />
                )}
                {selectedLog === 'wallet-backend' &&
                  backendLog.map((backendOut, index) => {
                    return (
                      // eslint-disable-next-line react/no-array-index-key
                      <p key={index} className="is-family-monospace">
                        {backendOut}
                      </p>
                    );
                  })}
                {selectedLog === 'daemon' &&
                  daemonLog.map(consoleOut => {
                    if (consoleOut.trim() === '') {
                      return null;
                    }
                    let logColor = textColor;
                    const isProtocol = consoleOut.includes('TurtleCoin');
                    const isCheckpoints = consoleOut.includes('[checkpoints]');
                    const addedToMainChain = consoleOut.includes(
                      'added to main chain'
                    );
                    const stopSignalSent = consoleOut.includes(
                      'Stop signal sent'
                    );
                    const isError = consoleOut.includes('ERROR');
                    const isViolet = consoleOut.includes('===');
                    const isAscii =
                      consoleOut.includes('█') ||
                      consoleOut.includes('═') ||
                      consoleOut.includes('_') ||
                      consoleOut.includes('|');

                    const isLink = consoleOut.includes(
                      'https://github.com/turtlecoin/turtlecoin/blob/master/LICENSE'
                    );
                    const isChatLink = consoleOut.includes(
                      'http://chat.turtlecoin.lol'
                    );

                    let logText = consoleOut.replace('[protocol]', '');
                    logText = logText.replace('[Core]', '');
                    logText = logText.replace('[daemon]', '');
                    logText = logText.replace('[node_server]', '');
                    logText = logText.replace('[RocksDBWrapper]', '');
                    logText = logText.replace('http://chat.turtlecoin.lol', '');

                    if (isProtocol || isCheckpoints || addedToMainChain) {
                      logColor = 'has-text-success has-text-weight-bold';
                    }

                    if (stopSignalSent) {
                      logColor = 'has-text-primary has-text-weight-bold';
                    }

                    if (isError) {
                      logColor = 'has-text-danger has-text-weight-bold';
                    }

                    if (isViolet) {
                      logColor = 'has-text-violet has-text-weight-bold';
                    }

                    if (isAscii) {
                      return null;
                    }

                    if (isLink) {
                      return (
                        <a
                          key={consoleOut}
                          className="has-text-link is-family-monospace"
                          onClick={() => remote.shell.openExternal(logText)}
                          onKeyPress={() => remote.shell.openExternal(logText)}
                          role="button"
                          tabIndex={0}
                          onMouseDown={event => event.preventDefault()}
                        >
                          {logText}
                        </a>
                      );
                    }

                    if (isChatLink) {
                      return (
                        <p key={consoleOut} className="is-family-monospace">
                          {logText}{' '}
                          <a
                            className="has-text-link is-family-monospace"
                            onClick={() =>
                              remote.shell.openExternal(
                                'http://chat.turtlecoin.lol'
                              )
                            }
                            onKeyPress={() =>
                              remote.shell.openExternal(
                                'http://chat.turtlecoin.lol'
                              )
                            }
                            role="button"
                            tabIndex={0}
                            onMouseDown={event => event.preventDefault()}
                          >
                            http://chat.turtlecoin.lol
                          </a>
                        </p>
                      );
                    }
                    return (
                      <p
                        key={consoleOut}
                        className={`is-family-monospace ${logColor}`}
                      >
                        {logText}
                      </p>
                    );
                  })}
              </div>
            </div>
            <div
              ref={element => {
                this.terminalEnd = element;
              }}
            />
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
