// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import { remote } from 'electron';
import React, { Component } from 'react';
import { WalletBackend, Daemon } from 'turtlecoin-wallet-backend';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import { uiType } from '../utils/utils';
import {
  eventEmitter,
  savedInInstallDir,
  il8n,
  reInitWallet,
  config
} from '../index';

type Props = {};

type States = {
  darkMode: boolean
};

export default class Import extends Component<Props, States> {
  props: Props;

  states: States;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: config.darkMode
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleSubmit = (event: any) => {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();

    const { darkMode } = this.state;
    const { textColor } = uiType(darkMode);

    const seed = event.target[0].value;
    let height = Number(event.target[1].value);

    const password = event.target[2].value;
    const confirmPassword = event.target[3].value;

    if (seed === undefined) {
      return;
    }

    if (password !== confirmPassword) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Password Match Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            Passwords do not match. Check entered passwords and try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
      return;
    }

    if (height === '') {
      height = 0;
    }

    const options = {
      defaultPath: remote.app.getPath('documents'),
      filters: [
        {
          name: 'TurtleCoin Wallet File (v0)',
          extensions: ['wallet']
        }
      ]
    };
    const savePath = remote.dialog.showSaveDialog(null, options);
    if (savePath === undefined) {
      return;
    }
    if (savedInInstallDir(savePath)) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Restore Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            You can not save the wallet in the installation directory. The
            windows installer will delete all files in the directory upon
            upgrading the application, so it is not allowed.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
      return;
    }

    const [importedWallet, error] = WalletBackend.importWalletFromSeed(
      new Daemon('blockapi.turtlepay.io', 443),
      height,
      seed
    );

    if (error) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Restore Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The restore was not successful. Please check your details and try
            again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
    } else {
      const saved = importedWallet.saveWalletToFile(savePath, password);
      if (saved) {
        reInitWallet(savePath);
      } else {
        const message = (
          <div>
            <center>
              <p className="subtitle has-text-danger">Wallet Save Error!</p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              The wallet was not saved successfully. Check your directory
              permissions and try again.
            </p>
          </div>
        );
        eventEmitter.emit('openModal', message, 'OK', null, null);
      }
    }
  };

  render() {
    const { darkMode } = this.state;
    const { backgroundColor, textColor, elementBaseColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <form onSubmit={this.handleSubmit}>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="seed">
                  {il8n.mnemonic_seed}
                  <textarea
                    className="input is-large"
                    placeholder={il8n.mnemonic_seed_input_placeholder}
                  />
                </label>
              </div>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="scanheight">
                  {il8n.scan_height}
                  <div className="control">
                    <input
                      className="input is-large"
                      type="text"
                      placeholder={il8n.scan_height_input_placeholder}
                    />
                  </div>
                </label>
              </div>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="password">
                  New Wallet Password
                  <div className="control">
                    <input
                      className="input is-large"
                      type="text"
                      placeholder="Enter a password for your wallet."
                    />
                  </div>
                </label>
              </div>
              <div className="field">
                <label
                  className={`label ${textColor}`}
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                  <div className="control">
                    <input
                      className="input is-large"
                      type="text"
                      placeholder="Confirm password."
                    />
                  </div>
                </label>
              </div>
              <div className="buttons">
                <button type="submit" className="button is-success is-large ">
                  {il8n.import}
                </button>
                <button
                  type="reset"
                  className={`button is-large ${elementBaseColor}`}
                >
                  {il8n.reset}
                </button>
              </div>
            </form>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
