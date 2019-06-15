/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import { remote, app } from 'electron';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import log from 'electron-log';
import routes from '../constants/routes';
import { config, session } from '../reducers/index';
import navBar from './NavBar';

// import styles from './Send.css';

type Props = {
  syncStatus: Number,
  unlockedBalance: Number,
  lockedBalance: Number,
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
      transactionInProgress: false
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
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
    if (height === undefined) {
      height = 0
    }

    const savePath = remote.dialog.showSaveDialog();
    if (savePath === undefined) {
      return;
    }

    const importedSuccessfully = session.handleImportFromSeed(seed, savePath, parseInt(height));
    if (importedSuccessfully === true) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: ['OK'],
        title: 'Wallet imported successfully!',
        message: 'The wallet was imported successfully. You can now open your wallet file.'
      });
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
                  placeholder='Enter your seed here.'
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
          <div className="field is-grouped is-grouped-multiline">
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Balance:</span>
                <span className="tag is-info is-large">
                  {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
                </span>
              </div>
            </div>
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Sync:</span>
                {this.state.syncStatus < 100 && (
                  <span className="tag is-warning is-large">
                    {this.state.syncStatus}%
                    <ReactLoading
                      type="bubbles"
                      color="#000000"
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
          </div>
        </div>
      </div>
    );
  }
}
