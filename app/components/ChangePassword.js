// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { config, session, eventEmitter, il8n, loginCounter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  darkMode: boolean,
  pageAnimationIn: string
};

export default class ChangePassword extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      pageAnimationIn: loginCounter.getAnimation('/changepassword')
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleSubmit = (event: any) => {
    const { darkMode } = this.state;
    const { textColor } = uiType(darkMode);
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    const oldPassword = event.target[0].value;
    const newPassword = event.target[1].value;
    const passwordConfirm = event.target[2].value;
    if (oldPassword !== session.walletPassword) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Incorrect Password!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            You did not enter your current password correctly. Please try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
      return;
    }
    if (newPassword !== passwordConfirm) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Password Do Not Match!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The passwords you entered were not the same. Try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
      return;
    }
    session.walletPassword = newPassword;
    const saved = session.saveWallet(config.walletFile);
    if (saved) {
      const message = (
        <div>
          <center>
            <p className={`title ${textColor}`}>Success!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The password was changed successfully. Take care not to forget it.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'openNewWallet');
    } else {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The password was not changed sucessfully. Check that you have write
            permissions to the file and try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
    }
  };

  render() {
    const { darkMode, pageAnimationIn } = this.state;
    const { backgroundColor, fillColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${fillColor}`}>
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor} ${pageAnimationIn}`}>
            <form onSubmit={this.handleSubmit}>
              {session.walletPassword !== '' && (
                <div className="field">
                  <label className={`label ${textColor}`} htmlFor="scanheight">
                    {il8n.change_passwd_enter_current_passwd}
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder={
                          il8n.change_passwd_enter_current_passwd_input_placeholder
                        }
                      />
                    </div>
                  </label>
                </div>
              )}
              {session.walletPassword === '' && (
                <div className="field">
                  <label
                    className={`label ${textColor} is-hidden`}
                    htmlFor="scanheight"
                  >
                    {il8n.change_passwd_enter_current_passwd}
                    <div className="control">
                      <input
                        className="input is-large is-hidden"
                        type="password"
                        placeholder={
                          il8n.change_passwd_enter_current_passwd_no_passwd_input_placeholder
                        }
                        disabled
                      />
                    </div>
                  </label>
                </div>
              )}
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="scanheight">
                  {il8n.change_passwd_enter_new_passwd}
                  <div className="control">
                    <input
                      className="input is-large"
                      type="password"
                      placeholder={
                        il8n.change_passwd_enter_new_passwd_input_placeholder
                      }
                    />
                  </div>
                </label>
              </div>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="scanheight">
                  {il8n.change_passwd_confirm_new_passwd}
                  <div className="control">
                    <input
                      className="input is-large"
                      type="password"
                      placeholder={
                        il8n.change_passwd_confirm_new_passwd_input_placeholder
                      }
                    />
                  </div>
                </label>
              </div>
              {session.walletPassword !== '' && (
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    {il8n.change}
                  </button>
                </div>
              )}
              {session.walletPassword === '' && (
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    {il8n.set_password}
                  </button>
                </div>
              )}
            </form>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
