// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
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
import substringsToRemove from '../constants/terminal/substringsToRemove.json';
import terminalStyleConfig from '../constants/terminal/styleConfig.json';
import walletBackendStyleConfig from '../constants/terminal/backendStyleConfig.json';
import linesToIgnore from '../constants/terminal/linesToIgnore.json';

const styleConfig: { [key: string]: any } = terminalStyleConfig;
const backendStyleConfig: { [key: string]: any } = walletBackendStyleConfig;
const styleValues = Object.keys(styleConfig);
const backendStyleValues = Object.keys(backendStyleConfig);

type Props = {};

type State = {
  darkMode: boolean,
  daemonLog: string[],
  pageAnimationIn: string,
  backendLog: string[],
  selectedLog: string,
  hideMenu: boolean
};

export default class Terminal extends Component<Props, State> {
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
      selectedLog: loginCounter.selectedLog,
      hideMenu: true
    };

    this.refreshConsole = this.refreshConsole.bind(this);
    this.setActiveLog = this.setActiveLog.bind(this);
    this.showMenu = this.showMenu.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('refreshConsole', this.refreshConsole);
    eventEmitter.on('refreshBackendLog', this.refreshBackendLog);
    this.scrollToBottom();
    setTimeout(this.showMenu, 200);
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

  showMenu = () => {
    this.setState({
      hideMenu: false
    });
  };

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
      selectedLog,
      hideMenu
    } = this.state;
    const { backgroundColor, textColor, fillColor, toolTipColor } = uiType(
      darkMode
    );
    const showTerminal = loginCounter.daemonFailedInit || config.useLocalDaemon;

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
                {!hideMenu && (
                  <aside className="menu log-menu swing-in-top-fwd">
                    <p className={`menu-label ${textColor}`}>Logs</p>
                    <ul className="menu-list">
                      {config.logLevel !== 'DISABLED' && (
                        <li>
                          <a
                            className={`menu-link-light ${textColor}`}
                            onClick={() => this.setActiveLog('wallet-backend')}
                            onKeyPress={() =>
                              this.setActiveLog('wallet-backend')
                            }
                            role="button"
                            tabIndex={0}
                            onMouseDown={event => event.preventDefault()}
                          >
                            WalletBackend
                          </a>
                        </li>
                      )}
                      {showTerminal && (
                        <li>
                          <a
                            className={`menu-link-light ${textColor}`}
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
                )}
              </div>
              <div className="column terminal">
                {false && (
                  <input
                    className="bash-prompt has-text-weight-bold has-icons-left has-text-success is-family-monospace"
                    ref={input => input && input.focus()}
                    type="text"
                  />
                )}
                {backendLog &&
                  selectedLog === 'wallet-backend' &&
                  backendLog.map((line, index) => {
                    // don't print empty messages
                    if (line.trim() === '') {
                      return null;
                    }

                    // let's determine the log styles based on styleConfig.json
                    let logStyles: string = '';
                    backendStyleValues.forEach((color: string) => {
                      const { strings } = backendStyleConfig[color];
                      strings.forEach((string: string) => {
                        if (line.includes(string)) {
                          logStyles = backendStyleConfig[color].class;
                        }
                      });
                    });

                    // finally print the log message
                    return (
                      <span
                        className={`is-family-monospace ${logStyles}`}
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                      >
                        {line}
                      </span>
                    );
                  })}
                {daemonLog &&
                  selectedLog === 'daemon' &&
                  daemonLog.map((line, index) => {
                    // don't print empty messages
                    if (line.trim() === '') {
                      return null;
                    }

                    // ignore the line if it is in linesToIgnore.json
                    let showLine: boolean = true;
                    linesToIgnore.forEach((string: string) => {
                      if (line.includes(string)) {
                        showLine = false;
                      }
                    });
                    if (!showLine) {
                      return null;
                    }

                    // let's determine the log styles based on styleConfig.json
                    let logStyles: string = '';
                    styleValues.forEach((color: string) => {
                      const { strings } = styleConfig[color];
                      strings.forEach((string: string) => {
                        if (line.includes(string)) {
                          logStyles = styleConfig[color].class;
                        }
                      });
                    });

                    // Trim substrings that are in the substringsToRemove.json file
                    let logText: string = line;
                    substringsToRemove.forEach(string => {
                      logText = logText.replace(string, '');
                    });

                    // finally print the log message
                    return (
                      <span
                        className={`is-family-monospace ${logStyles}`}
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                      >
                        {logText}
                      </span>
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
