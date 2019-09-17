// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import uiType from '../utils/uitype';
import { session, config, eventEmitter } from '../index';

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
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    this.setState({
      closeToTray: true
    });
    session.toggleCloseToTray(true);
    const message = (
      <div>
        <center>
          <p className={`title ${textColor}`}>Warning!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          Changing this setting requires an application restart. Would you like
          to restart now?
        </p>
      </div>
    );
    eventEmitter.emit(
      'openModal',
      message,
      'Restart',
      'Not Now',
      'restartApplication'
    );
  };

  closeToTrayOff = () => {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    this.setState({
      closeToTray: false
    });
    session.toggleCloseToTray(false);
    const message = (
      <div>
        <center>
          <p className={`title ${textColor}`}>Warning!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          Changing this setting requires an application restart. Would you like
          to restart now?
        </p>
      </div>
    );
    eventEmitter.emit(
      'openModal',
      message,
      'Restart',
      'Not Now',
      'restartApplication'
    );
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
