// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import os from 'os';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import FiatSelector from './FiatSelector';
import TimeoutSelector from './TimeoutSelector';
import NodeChanger from './NodeChanger';
import uiType from '../utils/uitype';
import Rescanner from './Rescanner';
import DarkModeToggle from './DarkModeToggle';
import CloseToTrayToggle from './CloseToTrayToggle';
import ScanCoinbaseToggle from './ScanCoinbaseToggle';

type Props = {};

type State = {
  darkMode: boolean,
  activeTab: string
};

export default class Settings extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      activeTab: 'node'
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
    this.setActiveTab = this.setActiveTab.bind(this);
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

  setActiveTab = (activeTab: string) => {
    this.setState({
      activeTab
    });
  };

  handlePasswordChange = () => {
    eventEmitter.emit('handlePasswordChange');
  };

  handleBackup = () => {
    eventEmitter.emit('handleBackup');
  };

  render() {
    const { darkMode, activeTab } = this.state;
    const { backgroundColor, textColor } = uiType(darkMode);

    let platform;
    switch (os.platform()) {
      case 'win32':
        platform = 'Windows';
        break;
      case 'linux':
        platform = 'Linux';
        break;
      case 'darwin':
        platform = 'MacOS';
        break;
      default:
        platform = 'OS';
        break;
    }

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
              <div className="column is-one-fifth">
                <aside className="menu">
                  <p className={`menu-label ${textColor}`}>Settings</p>
                  <ul className="menu-list">
                    <li>
                      <a
                        onClick={() => this.setActiveTab('node')}
                        onKeyPress={() => this.setActiveTab('node')}
                        role="button"
                        tabIndex={0}
                        className={activeTab === 'node' ? 'is-active' : ''}
                      >
                        Node
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() => this.setActiveTab('scan')}
                        onKeyPress={() => this.setActiveTab('scan')}
                        role="button"
                        tabIndex={0}
                        className={activeTab === 'scan' ? 'is-active' : ''}
                      >
                        Scan
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() => this.setActiveTab('display')}
                        onKeyPress={() => this.setActiveTab('display')}
                        role="button"
                        tabIndex={0}
                        className={activeTab === 'display' ? 'is-active' : ''}
                      >
                        Display
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() => this.setActiveTab('security')}
                        onKeyPress={() => this.setActiveTab('security')}
                        role="button"
                        tabIndex={0}
                        className={activeTab === 'security' ? 'is-active' : ''}
                      >
                        Security
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() => this.setActiveTab('platform')}
                        onKeyPress={() => this.setActiveTab('platform')}
                        role="button"
                        tabIndex={0}
                        className={activeTab === 'platform' ? 'is-active' : ''}
                      >
                        {platform} Settings
                      </a>
                    </li>
                  </ul>
                </aside>
              </div>
              {activeTab === 'node' && (
                <div className="column is-one-third">
                  <p className="menu-label">Node Settings</p>
                  <NodeChanger darkMode={darkMode} />
                </div>
              )}
              {activeTab === 'scan' && (
                <div className="column is-one-third">
                  <p className="menu-label">Scan Settings</p>
                  <Rescanner darkMode={darkMode} />
                  <br />
                  <ScanCoinbaseToggle darkMode={darkMode} />
                </div>
              )}
              {activeTab === 'display' && (
                <div className="column is-one-third">
                  <p className="menu-label">Display Settings</p>
                  <FiatSelector darkMode={darkMode} />
                  <br />
                  <DarkModeToggle darkMode={darkMode} />
                </div>
              )}
              {activeTab === 'security' && (
                <div className="column is-one-third">
                  <p className="menu-label">Security Settings</p>
                  <TimeoutSelector darkMode={darkMode} />
                  <br />
                  <button
                    className="button is-warning"
                    onClick={this.handlePasswordChange}
                  >
                    Change Wallet Password
                  </button>
                  <br />
                  <br />
                  <button
                    className="button is-danger"
                    onClick={this.handleBackup}
                  >
                    Backup Wallet Keys/Seed
                  </button>
                </div>
              )}
              {activeTab === 'platform' && (
                <div className="column is-one-third">
                  <p className="menu-label">{platform} Settings</p>
                  <CloseToTrayToggle darkMode={darkMode} />
                  <br />
                </div>
              )}
            </div>
          </div>
        </div>
        <BottomBar darkMode={darkMode} />
      </div>
    );
  }
}
