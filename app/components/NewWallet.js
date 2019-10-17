// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import jdenticon from 'jdenticon';
import { WalletBackend } from 'turtlecoin-wallet-backend';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';
import { session, saveNew } from '../index';

type State = {
  darkMode: boolean,
  newWallet: any,
  password: string,
  confirmPassword: string,
  confirmSeed: string,
  activePage: string
};

type Props = {};

export default class NewWallet extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      newWallet: WalletBackend.createWallet(session.daemon),
      activePage: 'generate',
      password: '',
      confirmPassword: '',
      confirmSeed: ''
    };

    this.nextPage = this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(
      this
    );
    this.handleConfirmSeedChange = this.handleConfirmSeedChange.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  evaluatePageNumber = (pageName: string) => {
    switch (pageName) {
      default:
        log.error('Programmer error!');
        break;
      case 'generate':
        return 1;
      case 'secure':
        return 2;
      case 'backup':
        return 3;
      case 'verify':
        return 4;
    }
  };

  evaluatePageName = (pageNumber: number) => {
    switch (pageNumber) {
      default:
        log.error('Programmer error!');
        break;
      case 1:
        return 'generate';
      case 2:
        return 'secure';
      case 3:
        return 'backup';
      case 4:
        return 'verify';
    }
  };

  prevPage = () => {
    const { activePage } = this.state;
    let currentPageNumber: number = this.evaluatePageNumber(activePage);

    if (currentPageNumber === 1) {
      return;
    }

    currentPageNumber--;
    const newPageName = this.evaluatePageName(currentPageNumber);

    this.setState({
      activePage: newPageName
    });
  };

  nextPage = () => {
    const {
      activePage,
      password,
      confirmPassword,
      confirmSeed,
      newWallet
    } = this.state;
    let currentPageNumber: number = this.evaluatePageNumber(activePage);

    if (currentPageNumber === 4) {
      log.info(confirmSeed);
      const [wallet, err] = WalletBackend.importWalletFromSeed(
        session.daemon,
        100000,
        confirmSeed
      );

      if (err) {
        log.error(err);
      }

      if (wallet) {
        log.debug(wallet.getPrimaryAddress());
        log.debug(newWallet.getPrimaryAddress());

        if (wallet.getPrimaryAddress() === newWallet.getPrimaryAddress()) {
          saveNew(wallet);
        } else {
          log.error('Wallet creation error.');
        }
      }

      return;
    }

    if (currentPageNumber === 2 && password !== confirmPassword) {
      return;
    }

    currentPageNumber++;
    const newPageName = this.evaluatePageName(currentPageNumber);

    this.setState({
      activePage: newPageName
    });
  };

  handlePasswordChange(event: any) {
    const password = event.target.value;

    this.setState({
      password
    });
  }

  handleConfirmSeedChange(event: any) {
    const confirmSeed = event.target.value;

    this.setState({
      confirmSeed
    });
  }

  handleConfirmPasswordChange(event: any) {
    const confirmPassword = event.target.value;

    this.setState({
      confirmPassword
    });
  }

  render() {
    const {
      darkMode,
      newWallet,
      activePage,
      password,
      confirmPassword,
      confirmSeed
    } = this.state;
    const { backgroundColor, fillColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${fillColor} hide-scrollbar`}>
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <div className={`steps ${textColor} is-dark`} id="stepsDemo">
              <div
                className={`step-item ${
                  activePage === 'generate' ? 'is-active' : ''
                } is-success`}
              >
                <div className="step-marker">1</div>
                <div className="step-details">
                  <p className="step-title">Generate</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'secure' ? 'is-active' : ''
                } is-success`}
              >
                <div className="step-marker">2</div>
                <div className="step-details">
                  <p className="step-title">Secure</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'backup' ? 'is-active' : ''
                } is-success`}
              >
                <div className="step-marker">3</div>
                <div className="step-details">
                  <p className="step-title">Backup</p>
                </div>
              </div>
              <div
                className={`step-item ${
                  activePage === 'verify' ? 'is-active' : ''
                } is-success`}
              >
                <div className="step-marker">4</div>
                <div className="step-details">
                  <p className="step-title">Verify</p>
                </div>
              </div>
            </div>

            {activePage === 'generate' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  Welcome to the wallet creation wizard. Each address is
                  randomly generated.
                </p>
                <div className="columns">
                  <div className="column">
                    <p className={`${textColor} label`}>
                      Your New Address:
                      <textarea
                        className="textarea is-large no-resize is-family-monospace"
                        rows="4"
                        readOnly
                        value={newWallet.getPrimaryAddress()}
                      />
                    </p>
                  </div>
                  <div className="column is-one-fifth">
                    <p className={`label ${textColor}`}>
                      Identicon:
                      <div className="box">
                        <center>
                          <span
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{
                              __html: jdenticon.toSvg(
                                newWallet.getPrimaryAddress(),
                                130
                              )
                            }}
                          />
                        </center>
                      </div>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activePage === 'secure' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  Set a password for your wallet. Take care not to forget it.
                </p>
                <div className="field">
                  <label className={`label ${textColor}`} htmlFor="scanheight">
                    Enter a Password:
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder="Enter a password"
                        value={password}
                        onChange={this.handlePasswordChange}
                      />
                    </div>
                  </label>
                </div>
                <div className="field">
                  <label className={`label ${textColor}`} htmlFor="scanheight">
                    Confirm Password:{' '}
                    {password !== confirmPassword ? (
                      <span className="has-text-danger">
                        &nbsp;&nbsp;Passwords do not match!
                      </span>
                    ) : (
                      ''
                    )}
                    <div className="control">
                      <input
                        className="input is-large"
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={this.handleConfirmPasswordChange}
                      />
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activePage === 'backup' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  Please back up the following mnemonic seed safely.{' '}
                  <span className="has-text-danger has-text-weight-bold ">
                    If you lose it your funds will be lost forever.
                  </span>
                </p>
                <p className={`label ${textColor}`}>
                  Mnemonic Seed:
                  <textarea
                    className="textarea no-resize is-large"
                    value={newWallet.getMnemonicSeed()[0]}
                    rows="4"
                    readOnly
                  />
                </p>
              </div>
            )}

            {activePage === 'verify' && (
              <div>
                <p className={`subtitle ${textColor}`}>
                  Enter your seed to confirm you&apos;ve backed it up.
                </p>
                <p className={`label ${textColor}`}>
                  Confirm Seed:
                  <textarea
                    className="textarea no-resize is-large"
                    value={confirmSeed}
                    onChange={this.handleConfirmSeedChange}
                    rows="4"
                  />
                </p>
              </div>
            )}

            <br />
            <center>
              <span
                className="button is-warning"
                onClick={this.prevPage}
                onKeyPress={this.prevPage}
                role="button"
                tabIndex={0}
                onMouseDown={event => event.preventDefault()}
              >
                Back
              </span>
              &nbsp;&nbsp;
              <span
                className="button is-success"
                onClick={this.nextPage}
                onKeyPress={this.nextPage}
                role="button"
                tabIndex={0}
                onMouseDown={event => event.preventDefault()}
              >
                {activePage === 'verify' ? 'Save Wallet As' : 'Next'}
              </span>
            </center>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
