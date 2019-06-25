/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import { remote, ipcRenderer } from 'electron';
import fs from 'fs';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect, Link } from 'react-router-dom';
import log from 'electron-log';
import { session } from '../reducers/index';
import navBar from './NavBar';
import routes from '../constants/routes';
import { config, directories } from '../reducers/index';

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
      importseed: false
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', (evt, route) =>
      this.handleImportFromSeed(evt, route)
    );
    ipcRenderer.on('importKey', (evt, route) =>
      this.handleImportFromKey(evt, route)
    );
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
  }

  handleImportFromSeed(evt, route) {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    clearInterval(this.interval);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    this.setState({
      importkey: true
    });
  }

  handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();

    let [seed, height] = [
      event.target[0].value, // seed
      event.target[1].value // scan height
    ];
    if (seed === undefined) {
      return;
    }
    if (height === '') {
      height = '0';
    }

    const savePath = remote.dialog.showSaveDialog();
    if (savePath === undefined) {
      return;
    }

    const importedSuccessfully = session.handleImportFromSeed(
      seed,
      savePath,
      parseInt(height)
    );
    if (importedSuccessfully === true) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Wallet imported successfully!',
        message:
          'The wallet was imported successfully. Opening your new wallet file...'
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
      remote.app.relaunch();
      remote.app.exit();
    } else {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: ['OK'],
        title: 'Error importing wallet!',
        message: 'The wallet was not imported successfully. Try again.'
      });
    }
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions()
    }));
  }

  render() {
    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }

    return (
      <div>
        {navBar('import')}
        <div className="box has-background-light maincontent">
          <form onSubmit={this.handleSubmit}>
            <div className="field">
              <label className="label" htmlFor="seed">
                Mnemonic Seed
                <textarea
                  className="textarea is-large"
                  placeholder="Enter your seed here."
                  id="seed"
                />
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
        <div className="box has-background-grey-lighter footerbar">
          <div className="field is-grouped is-grouped-multiline is-grouped-right">
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-dark is-large">Sync:</span>
                {this.state.syncStatus < 100 && (
                  <span className="tag is-warning is-large">
                    {this.state.syncStatus}%
                    <ReactLoading
                      type="bubbles"
                      color="#363636"
                      height={30}
                      width={30}
                    />
                  </span>
                )}
                {this.state.syncStatus === 100 && (
                  <span className="tag is-success is-large">
                    {this.state.syncStatus}%
                  </span>
                )}
              </div>
            </div>
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-dark is-large">Balance:</span>
                <span className="tag is-info is-large">
                  {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
