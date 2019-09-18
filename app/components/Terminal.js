// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import path from 'path';
import os from 'os';
import { Tail } from 'tail';
import { session } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import Modal from './Modal';
import uiType from '../utils/uitype';

const homedir = os.homedir();

const directories = [
  `${homedir}/.protonwallet`,
  `${homedir}/.protonwallet/logs`
];

type Props = {};

type State = {
  darkMode: boolean,
  daemonLog: string[]
};

export default class Receive extends Component<Props, State> {
  props: Props;

  state: State;

  terminal: any;

  daemonLogPath: string;

  daemonLog: string[];

  daemonLogTail: Tail;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      daemonLog: []
    };
    this.daemonLog = [];
    this.daemonLogPath = path.resolve(directories[1], 'TurtleCoind.log');
    this.daemonLogTail = new Tail(this.daemonLogPath);
    this.pushToConsole = this.pushToConsole.bind(this);
  }

  componentDidMount() {
    this.daemonLogTail.on('line', data => this.pushToConsole(data));
  }

  componentWillUnmount() {
    this.daemonLogTail.off('line', data => this.pushToConsole(data));
  }

  pushToConsole = (data: string) => {
    this.daemonLog.unshift(data);
    this.setState({
      daemonLog: this.daemonLog
    });
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
            className={`maincontent ${backgroundColor} ${textColor} terminal`}
          >
            {daemonLog.map(consoleOut => {
              return <p className={textColor}>{consoleOut}</p>;
            })}
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
