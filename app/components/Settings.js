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
import TimeoutSelector from './TimeoutSelector';
import NodeChanger from './NodeChanger';
import uiType from '../utils/uitype';
import Rewinder from './Rewinder';
import Rescanner from './Rescanner';

type Props = {};

type State = {
  darkMode: boolean,
  closeToTray: boolean,
  scanCoinbaseTransactions: boolean
};

export default class Settings extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      closeToTray: config.closeToTray || false,
      scanCoinbaseTransactions: config.scanCoinbaseTransactions || false
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
    this.closeToTrayOn = this.closeToTrayOn.bind(this);
    this.closeToTrayOff = this.closeToTrayOff.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

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

  render() {
    const { darkMode, closeToTray, scanCoinbaseTransactions } = this.state;

    const { backgroundColor, textColor } = uiType(darkMode);

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
                <NodeChanger />
                <br />
                <Rewinder />
                <br />
                <br />
                <Rescanner />
              </div>
              <div className="column">
                <FiatSelector />
                <br />
                <br />
                <TimeoutSelector />
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
