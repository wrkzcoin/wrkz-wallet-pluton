/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import { remote, ipcRenderer } from 'electron';
import fs from 'fs';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect, Link } from 'react-router-dom';
import log from 'electron-log';
import { config, session, directories, eventEmitter } from '../index';
import navBar from './NavBar';
import routes from '../constants/routes';

// import styles from './Send.css';

type Props = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>,
  handleSubmit: () => void,
  transactionInProgress: boolean
};

export default class ChangePassword extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      importkey: false,
      importseed: false,
      importCompleted: false,
      loginFailed: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handleInitialize = this.handleInitialize.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    eventEmitter.on('initializeNewSession', this.handleInitialize);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('openNewWallet', this.handleInitialize);

  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
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

  handleImportFromSeed(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    clearInterval(this.interval);
    this.setState({
      importkey: true
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
    } else {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Error!',
        message: 'The password was not changed successfully. Try again.'
      });
    }
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
  }

  render() {
    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }

    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }
    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }
    if (this.state.importCompleted === true) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        {navBar('changepassword')}
        <div className="box has-background-light maincontent">
          <div className="box changepasswordbox has-background-white">
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
        </div>
        <div className="box has-background-grey-lighter footerbar" />
      </div>
    );
  }
}
