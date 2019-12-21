// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import uiType from '../utils/uitype';
import { session, eventEmitter } from '../index';

type State = {
  darkMode: boolean
};

type Props = {};

export default class DarkModeToggle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

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

  render() {
    const { darkMode } = this.state;
    const { textColor } = uiType(true);
    return (
      <div>
        {darkMode === true && (
          <span className={textColor}>
            <a
              className="button is-black"
              onClick={this.darkModeOff}
              onKeyPress={this.darkModeOff}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large has-text-warning">
                <i className="fas fa-moon" />
              </span>
            </a>
            &nbsp;&nbsp; Dark Mode: <b>on</b>
          </span>
        )}
        {darkMode === false && (
          <span>
            <a
              className="button is-info"
              onClick={this.darkModeOn}
              onKeyPress={this.darkModeOn}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large has-text-warning">
                <i className="fas fa-sun" />
              </span>
            </a>
            &nbsp;&nbsp; Dark Mode: <b>off</b>
          </span>
        )}
      </div>
    );
  }
}
