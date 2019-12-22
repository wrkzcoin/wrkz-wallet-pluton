// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { session, eventEmitter, loginCounter, il8n } from '../index';
import Redirector from './Redirector';
import SyncReminder from './SyncReminder';
import Modal from './Modal';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  darkMode: boolean,
  walletFile: string,
  wrongPassword: boolean
};

export default class Login extends Component<Props, State> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode || false,
      walletFile: session.walletFile,
      wrongPassword: loginCounter.lastLoginAttemptFailed
    };
    const { wrongPassword } = this.state;
    if (!wrongPassword && !session.wallet) {
      this.switchAnimation();
    }
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    loginCounter.navBarCount = 0;
    ipcRenderer.on(
      'fromBackend',
      (event: Electron.IpcRendererEvent, message: any) => {
        const { messageType, data } = message;
        if (messageType === 'authenticationStatus') {
          loginCounter.isLoggedIn = data;
          loginCounter.lastLoginAttemptFailed = !data;
          loginCounter.loginFailed = !data;
          eventEmitter.emit('goHome');
        }
      }
    );
  }

  componentWillUnmount() {}

  switchAnimation() {
    loginCounter.userLoginAttempted = true;
  }

  handleSubmit = async (event: any) => {
    // We're preventing the default refresh of the app that occurs on form submit
    event.preventDefault();
    loginCounter.loginsAttempted++;
    const password = event.target[0].value;
    if (password === undefined) {
      return;
    }
    if (!loginCounter.walletActive) {
      ipcRenderer.send('fromFrontend', 'walletPassword', password);
    } else {
      ipcRenderer.send('fromFrontend', 'verifyWalletPassword', password);
    }
  };

  render() {
    const { darkMode, wrongPassword, walletFile } = this.state;
    const { backgroundColor, fillColor, textColor } = uiType(darkMode);
    return (
      <div>
        <Redirector />
        <Modal darkMode={darkMode} />
        <div className={`fullwindow ${backgroundColor}`}>
          <div className="mid-div">
            <div
              className={
                wrongPassword && loginCounter.loginsAttempted > 0
                  ? `box loginbox-fail inner-div ${fillColor}`
                  : `box loginbox inner-div ${fillColor}`
              }
            >
              <form onSubmit={this.handleSubmit}>
                <div className="field">
                  <label className={`label ${textColor}`} htmlFor="scanheight">
                    {il8n.password}
                    <div className="control">
                      <input
                        ref={input => input && input.focus()}
                        className={
                          wrongPassword
                            ? 'input is-large is-danger'
                            : 'input is-large'
                        }
                        type="password"
                        placeholder={il8n.password_input_placeholder}
                      />
                    </div>
                  </label>
                  <label className={`help ${textColor}`} htmlFor="scanheight">
                    {session.wallet
                      ? il8n.currently_logged_in
                      : il8n.attempting_login_to}
                    <b>{walletFile}</b>
                  </label>
                </div>
                <div className="columns">
                  <div className="column">
                    {session.wallet && (
                      <SyncReminder
                        className="syncreminder"
                        darkMode={darkMode}
                      />
                    )}
                  </div>
                  <div className="column">
                    <div className="buttons is-right">
                      <button
                        type="submit"
                        className="button is-success is-large"
                      >
                        {session.wallet ? il8n.unlock : il8n.login}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
