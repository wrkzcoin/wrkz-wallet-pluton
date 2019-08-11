// @flow
import { remote } from 'electron';
import React, { Component } from 'react';
import { config, session, eventEmitter, il8n } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  darkMode: boolean
};

export default class ChangePassword extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleSubmit = (event: any) => {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    const oldPassword = event.target[0].value;
    const newPassword = event.target[1].value;
    const passwordConfirm = event.target[2].value;
    if (oldPassword !== session.walletPassword) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: il8n.change_passwd_incorrect_passwd_title,
        message: il8n.change_passwd_incorrect_passwd_message
      });
      return;
    }
    if (newPassword !== passwordConfirm) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: il8n.change_passwd_passwd_mismatch_title,
        message: il8n.change_passwd_passwd_mismatch_message
      });
      return;
    }
    session.walletPassword = newPassword;
    const saved = session.saveWallet(config.walletFile);
    if (saved) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: [il8n.ok],
        title: il8n.change_passwd_passwd_change_success_title,
        message: il8n.change_passwd_passwd_change_success_message
      });
      eventEmitter.emit('openNewWallet');
    } else {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: il8n.change_passwd_passwd_change_unsuccess_title,
        message: il8n.change_passwd_passwd_change_unsuccess_message
      });
    }
  };

  render() {
    const { darkMode } = this.state;
    const { backgroundColor, fillColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${fillColor}`}>
          <NavBar />
          <div className={`maincontent ${backgroundColor}`}>
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
          <BottomBar />
        </div>
      </div>
    );
  }
}
