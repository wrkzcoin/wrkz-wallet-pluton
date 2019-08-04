// @flow
import { remote } from 'electron';
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import log from 'electron-log';
import { config, session, eventEmitter } from '../index';
import Redirector from './Redirector';

// import styles from './Send.css';

type Props = {};

type State = {
  importCompleted: boolean,
  loginFailed: boolean,
  darkMode: boolean
};

export default class FirstStartup extends Component<Props, State> {
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
    this.openExisting = this.openExisting.bind(this);
    this.openNewWallet = this.openNewWallet.bind(this);
    this.createNew = this.createNew.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('initializeNewSession', this.handleInitialize);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('openNewWallet', this.openNewWallet);
  }

  componentWillUnmount() {
    eventEmitter.off('initializeNewSession', this.handleInitialize);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    eventEmitter.off('openNewWallet', this.openNewWallet);
  }

  openNewWallet = () => {
    this.handleInitialize();
  };

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

  handleSubmit(event: any) {
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

  openExisting = () => {
    log.debug('User selected to open an existing wallet.');
    eventEmitter.emit('handleOpen');
  };

  createNew = () => {
    log.debug('User selected to create a new wallet.');
    eventEmitter.emit('handleNew');
  };

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
          <div className="fullwindow">
            <div className="mid-div">
              <div className="box loginbox has-background-light passwordchangebox">
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
          </div>
        )}
        {darkMode === true && (
          <div className="fullwindow has-background-dark">
            <div className="mid-div">
              <div className="box loginbox has-background-black passwordchangebox">
                <h1 className="title has-text-centered has-text-danger">
                  Welcome to Proton!
                </h1>
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
          </div>
        )}
      </div>
    );
  }
}
