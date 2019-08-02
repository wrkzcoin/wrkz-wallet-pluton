/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import { remote, ipcRenderer } from 'electron';
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { config, session, eventEmitter } from '../index';
import NavBar from './NavBar';

// import styles from './Send.css';

type Props = {};

export default class ChangePassword extends Component<Props> {
  props: Props;

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

  handleLoginFailure() {
    this.setState({
      loginFailed: true
    });
  }

  handleInitialize() {
    this.setState({
      importCompleted: true
    });
  }

  handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    const oldPassword = event.target[0].value;
    const newPassword = event.target[1].value;
    const passwordConfirm = event.target[2].value;
    if (oldPassword !== session.walletPassword) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Password incorrect!',
        message:
          'You did not enter your current password correctly. Please try again.'
      });
      return;
    }
    if (newPassword !== passwordConfirm) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Passwords do not match!',
        message: 'You did not enter the same password. Please try again.'
      });
      return;
    }
    session.walletPassword = newPassword;
    const saved = session.saveWallet(config.walletFile);
    if (saved) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Saved!',
        message: 'The password was changed successfully.'
      });
      this.handleInitialize();
    } else {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Error!',
        message: 'The password was not changed successfully. Try again.'
      });
    }
  }

  render() {
    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }
    if (this.state.importCompleted === true) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        {this.state.darkMode === false && (
          <div className="wholescreen">
            <NavBar />
            <div className="maincontent">
              <form onSubmit={this.handleSubmit}>
                {session.walletPassword !== '' && (
                  <div className="field">
                    <label className="label" htmlFor="scanheight">
                      Enter Current Password
                      <div className="control">
                        <input
                          className="input is-large"
                          type="password"
                          placeholder="Enter your current password..."
                        />
                      </div>
                    </label>
                  </div>
                )}
                {session.walletPassword === '' && (
                  <div className="field">
                    <label className="label" htmlFor="scanheight">
                      Enter Current Password
                      <div className="control">
                        <input
                          className="input is-large"
                          type="password"
                          placeholder="This wallet doesn't have a password"
                          disabled
                        />
                      </div>
                    </label>
                  </div>
                )}
                <div className="field">
                  <label className="label" htmlFor="scanheight">
                    Enter New Password
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder="Enter your new password..."
                      />
                    </div>
                  </label>
                </div>
                <div className="field">
                  <label className="label" htmlFor="scanheight">
                    Confirm Password
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder="Enter your new password again to confirm..."
                      />
                    </div>
                  </label>
                </div>
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    Change
                  </button>
                </div>
              </form>
            </div>
            <div className="footerbar has-background-light" />
          </div>
        )}
        {this.state.darkMode === true && (
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
                      Enter Current Password
                      <div className="control">
                        <input
                          className="input is-large"
                          type="password"
                          placeholder="Enter your current password..."
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
                      Enter Current Password
                      <div className="control">
                        <input
                          className="input is-large"
                          type="password"
                          placeholder="This wallet doesn't have a password"
                          disabled
                        />
                      </div>
                    </label>
                  </div>
                )}
                <div className="field">
                  <label className="label has-text-white" htmlFor="scanheight">
                    Enter New Password
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder="Enter your new password..."
                      />
                    </div>
                  </label>
                </div>
                <div className="field">
                  <label className="label has-text-white" htmlFor="scanheight">
                    Confirm Password
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder="Enter your new password again to confirm..."
                      />
                    </div>
                  </label>
                </div>
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    Change
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
