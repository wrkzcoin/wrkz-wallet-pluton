// @flow
import { remote } from 'electron';
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { config, session, eventEmitter, il8n } from '../index';
import NavBar from './NavBar';
import Redirector from './Redirector';

type Props = {};

type State = {
  importCompleted: boolean,
  loginFailed: boolean,
  darkMode: boolean
};

export default class ChangePassword extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      importCompleted: false,
      loginFailed: false,
      darkMode: session.darkMode
    };
    this.handleInitialize = this.handleInitialize.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('initializeNewSession', this.handleInitialize);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('openNewWallet', this.handleInitialize);
  }

  componentWillUnmount() {
    eventEmitter.off('initializeNewSession', this.handleInitialize);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    eventEmitter.off('openNewWallet', this.handleInitialize);
  }

  handleLoginFailure = () => {
    this.setState({
      loginFailed: true
    });
  };

  handleInitialize = () => {
    this.setState({
      importCompleted: true
    });
  };

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
      this.handleInitialize();
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
    const { loginFailed, importCompleted, darkMode } = this.state;

    if (loginFailed === true) {
      return <Redirect to="/login" />;
    }
    if (importCompleted === true) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        <Redirector />
        {darkMode === false && (
          <div className="wholescreen">
            <NavBar />
            <div className="maincontent">
              <form onSubmit={this.handleSubmit}>
                {session.walletPassword !== '' && (
                  <div className="field">
                    <label className="label" htmlFor="scanheight">
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
                    <label className="label" htmlFor="scanheight">
                      {il8n.change_passwd_enter_current_passwd}
                      <div className="control">
                        <input
                          className="input is-large"
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
                  <label className="label" htmlFor="scanheight">
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
                  <label className="label" htmlFor="scanheight">
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
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    {il8n.change}
                  </button>
                </div>
              </form>
            </div>
            <div className="footerbar has-background-light" />
          </div>
        )}
        {darkMode === true && (
          <div className="wholescreen has-background-dark">
            <NavBar />
            <div className="maincontent has-background-dark ">
              <form onSubmit={this.handleSubmit}>
                {session.walletPassword !== '' && (
                  <div className="field">
                    <label
                      className="label has-text-white"
                      htmlFor="scanheight"
                    >
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
                      className="label has-text-white"
                      htmlFor="scanheight"
                    >
                      {il8n.change_passwd_enter_current_passwd}
                      <div className="control">
                        <input
                          className="input is-large"
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
                  <label className="label has-text-white" htmlFor="scanheight">
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
                  <label className="label has-text-white" htmlFor="scanheight">
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
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    {il8n.change}
                  </button>
                </div>
              </form>
            </div>
            <div className="footerbar has-background-black" />
          </div>
        )}
      </div>
    );
  }
}
