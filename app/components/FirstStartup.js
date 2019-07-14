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

export default class FirstStartup extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      importkey: false,
      importseed: false,
      importCompleted: false,
      loginFailed: false,
      loginInProgress: false,
      darkMode: session.darkMode
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handleInitialize = this.handleInitialize.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.openExisting = this.openExisting.bind(this);
    this.openNewWallet = this.openNewWallet.bind(this);
    this.createNew = this.createNew.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    eventEmitter.on('initializeNewSession', this.handleInitialize);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('openNewWallet', this.openNewWallet);
    eventEmitter.on('importSeed', this.handleImportFromSeed);
    eventEmitter.on('importKey', this.handleImportFromKey);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    eventEmitter.off('initializeNewSession', this.handleInitialize);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    eventEmitter.off('openNewWallet', this.openNewWallet);
    eventEmitter.off('importSeed', this.handleImportFromSeed);
    eventEmitter.off('importKey', this.handleImportFromKey);
  }

  handleLoginInProgress() {
    log.debug('Login in progress...');
    this.setState({
      loginInProgress: true
    });
  }

  openNewWallet() {
    this.handleInitialize();
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

  openExisting() {
    log.debug('User selected to open an existing wallet.');
    eventEmitter.emit('handleOpen');
  }

  createNew() {
    this.handleLoginInProgress();
    log.debug('User selected to create a new wallet.');
    eventEmitter.emit('handleNew');
  }

  importFromKeysOrSeed() {
    log.debug('User selected to import wallet.');
    // seed will be 0, keys will be 1
    const userSelection = remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Cancel', 'Seed', 'Keys'],
      title: 'Seed',
      message: 'Would you like to restore from seed or keys?'
    });
    if (userSelection === 1) {
      log.debug('User selected to import from seed...');
      // this.mainWindow.webContents.send('importSeed');
      eventEmitter.emit('importSeed');
    } else if (userSelection === 2) {
      log.debug('User selected to import from keys...');
      eventEmitter.emit('importKey');
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
      {this.state.darkMode === true && (
        <div className="fullwindow">
          <div className="box changepasswordbox has-background-light passwordchangebox">
            <h1 className="title has-text-centered">Welcome to Proton!</h1>
            <button
              className="button is-large is-fullwidth"
              onClick={this.openExisting}
            >
              Open an Existing Wallet
            </button>
            <br />
            <button
              className="button is-large is-fullwidth"
              onClick={this.createNew}
            >
              Create a New Wallet
            </button>
            <br />
            <button
              className="button is-large is-fullwidth"
              onClick={this.importFromKeysOrSeed}
            >
              Import from Keys or Seed
            </button>
          </div>
        </div>
        )}
        {this.state.darkMode === true && (
          <div className="fullwindow has-background-dark">
            <div className="box changepasswordbox has-background-black passwordchangebox">
              <h1 className="title has-text-centered has-text-danger">Welcome to Proton!</h1>
              <button
                className="button is-large is-fullwidth is-dark"
                onClick={this.openExisting}
              >
                Open an Existing Wallet
              </button>
              <br />
              <button
                className="button is-large is-fullwidth is-dark"
                onClick={this.createNew}
              >
                Create a New Wallet
              </button>
              <br />
              <button
                className="button is-large is-fullwidth is-dark"
                onClick={this.importFromKeysOrSeed}
              >
                Import from Keys or Seed
              </button>
            </div>
          </div>
          )}
      </div>
    );
  }
}
