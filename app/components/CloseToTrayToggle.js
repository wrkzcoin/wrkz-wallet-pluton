// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { remote } from 'electron';
import log from 'electron-log';
import uiType from '../utils/uitype';
import { session, il8n, config } from '../index';

type State = {
  closeToTray: boolean
};

type Props = {
  darkMode: boolean
};

export default class CloseToTrayToggle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      closeToTray: config.closeToTray || false
    };
    this.closeToTrayOn = this.closeToTrayOn.bind(this);
    this.closeToTrayOff = this.closeToTrayOff.bind(this);
  }

  componentWillMount() {}

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
        log.debug(`Can't relaunch application while in dev mode.`);
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

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { closeToTray } = this.state;

    return (
      <div>
        {closeToTray === false && (
          <span className={textColor}>
            <a
              className="button is-danger"
              onClick={this.closeToTrayOn}
              onKeyPress={this.closeToTrayOn}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fas fa-times" />
              </span>
            </a>
            &nbsp;&nbsp; Close To Tray: <b>Off</b>
          </span>
        )}
        {closeToTray === true && (
          <span className={textColor}>
            <a
              className="button is-success"
              onClick={this.closeToTrayOff}
              onKeyPress={this.closeToTrayOff}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fa fa-check" />
              </span>
            </a>
            &nbsp;&nbsp; Close To Tray: <b>On</b>
          </span>
        )}
      </div>
    );
  }
}
