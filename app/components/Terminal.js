// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { session, daemonLogger, eventEmitter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import Modal from './Modal';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  darkMode: boolean,
  daemonLog: string[]
};

export default class Receive extends Component<Props, State> {
  props: Props;

  state: State;

  daemonLog: string[];

  constructor(props?: Props) {
    super(props);
    this.daemonLog = daemonLogger ? daemonLogger.daemonLog : [];
    const { darkMode } = session;

    this.state = {
      darkMode,
      daemonLog: this.daemonLog
    };

    this.refreshConsole = this.refreshConsole.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('refreshConsole', this.refreshConsole);
  }

  componentWillUnmount() {
    eventEmitter.off('refreshConsole', this.refreshConsole);
  }

  refreshConsole = () => {
    if (daemonLogger) {
      const { daemonLog } = daemonLogger;
      this.setState({
        daemonLog
      });
    }
  };

  render() {
    const { darkMode, daemonLog } = this.state;
    const { backgroundColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <Modal darkMode={darkMode} />
        <div className={`wholescreen ${backgroundColor}`}>
          <NavBar darkMode={darkMode} />
          <div
            className={`maincontent ${backgroundColor} ${textColor} terminal has-text-small`}
          >
            {daemonLog.map(consoleOut => {
              return (
                <p key={consoleOut} className={textColor}>
                  {consoleOut}
                </p>
              );
            })}
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
