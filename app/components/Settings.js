// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import FiatSelector from './FiatSelector';
import TimeoutSelector from './TimeoutSelector';
import NodeChanger from './NodeChanger';
import uiType from '../utils/uitype';
import Rewinder from './Rewinder';
import Rescanner from './Rescanner';
import DarkModeToggle from './DarkModeToggle';
import CloseToTrayToggle from './CloseToTrayToggle';
import ScanCoinbaseToggle from './ScanCoinbaseToggle';

type Props = {};

type State = {
  darkMode: boolean
};

export default class Settings extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
  }

  componentWillUnmount() {
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeoff', this.darkModeOff);
  }

  darkModeOn = () => {
    this.setState({
      darkMode: true
    });
  };

  darkModeOff = () => {
    this.setState({
      darkMode: false
    });
  };

  render() {
    const { darkMode } = this.state;
    const { backgroundColor } = uiType(darkMode);

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
                <NodeChanger darkMode={darkMode} />
                <br />
                <Rewinder darkMode={darkMode} />
                <br />
                <br />
                <Rescanner darkMode={darkMode} />
              </div>
              <div className="column">
                <FiatSelector darkMode={darkMode} />
                <br />
                <br />
                <TimeoutSelector darkMode={darkMode} />
              </div>
              <div className="column">
                <br />
                <div className="buttons is-right">
                  <DarkModeToggle darkMode={darkMode} />
                  <br />
                  <br />
                  <CloseToTrayToggle darkMode={darkMode} />
                  <br />
                  <br />
                  <ScanCoinbaseToggle darkMode={darkMode} />
                </div>
              </div>
            </div>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
