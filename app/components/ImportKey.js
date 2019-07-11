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

export default class Send extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions(),
      importkey: false,
      importseed: false,
      importCompleted: false,
      nodeFee: session.daemon.feeAmount,
      changePassword: false,
      loginFailed: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handleInitialize = this.handleInitialize.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    eventEmitter.on('initializeNewSession', this.handleInitialize);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('openNewWallet', this.handleInitialize);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
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

  handlePasswordChange() {
    this.setState({
      changePassword: true
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

    let [spendKey, viewKey, height] = [
      event.target[0].value, // private spend key
      event.target[1].value, // private view key
      event.target[2].value // scan height
    ];

    if (viewKey === undefined || spendKey === undefined) {
      return;
    }
    if (height === '') {
      height = '0';
    }

    const savePath = remote.dialog.showSaveDialog();
    if (savePath === undefined) {
      return;
    }

    const importedSuccessfully = session.handleImportFromKey(
      viewKey,
      spendKey,
      savePath,
      parseInt(height, 10)
    );
    if (importedSuccessfully === true) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Wallet imported successfully!',
        message:
          'The wallet was imported successfully. Go to Wallet > Password and add a password to the wallet if desired.'
      });
      const [programDirectory, logDirectory, walletDirectory] = directories;
      const modifyConfig = config;
      modifyConfig.walletFile = savePath;
      log.debug(`Set new config filepath to: ${modifyConfig.walletFile}`);
      config.walletFile = savePath;
      fs.writeFileSync(
        `${programDirectory}/config.json`,
        JSON.stringify(config, null, 4),
        err => {
          if (err) throw err;
          log.debug(err);
        }
      );
      log.debug('Wrote config file to disk.');
      eventEmitter.emit('initializeNewSession');
    } else {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Error importing wallet!',
        message:
          'The wallet was not imported successfully. Check that your keys are valid and try again.'
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
    if (this.state.changePassword === true) {
      return <Redirect to="/changepassword" />;
    }
    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }
    if (this.state.importCompleted === true) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        {navBar('import')}
        <div className="box has-background-light maincontent">
          <form onSubmit={this.handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="scanheight">
                Private Spend Key
                <div className="control">
                  <input
                    className="input is-large"
                    type="text"
                    placeholder="Enter your private view key..."
                    id="scanheight"
                  />
                </div>
              </label>
            </div>
            <div className="field">
              <label className="label" htmlFor="scanheight">
                Private View Key
                <div className="control">
                  <input
                    className="input is-large"
                    type="text"
                    placeholder="Enter your private spend key..."
                    id="scanheight"
                  />
                </div>
              </label>
            </div>
            <div className="field">
              <label className="label" htmlFor="scanheight">
                Scan Height (Optional)
                <div className="control">
                  <input
                    className="input is-large"
                    type="text"
                    placeholder="Block height to start scanning from. Defaults to 0."
                    id="scanheight"
                  />
                </div>
              </label>
            </div>
            <div className="buttons">
              <button type="submit" className="button is-success is-large ">
                Import
              </button>
              <button type="reset" className="button is-large">
                Clear
              </button>
            </div>
          </form>
        </div>
        <div className="box has-background-grey-lighter footerbar" />
      </div>
    );
  }
}
