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
import { session } from '../index';

type State = {
  darkMode: boolean,
  newWallet: any
};

type Props = {};

export default class NewWallet extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      newWallet: WalletBackend.createWallet(session.daemon),
      activePage: 'generate'
    };

    this.nextPage = this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
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
    const { activePage } = this.state;
    let currentPageNumber: number = this.evaluatePageNumber(activePage);

    if (currentPageNumber === 4) {
      return;
    }

    currentPageNumber++;
    const newPageName = this.evaluatePageName(currentPageNumber);

    this.setState({
      activePage: newPageName
    });
  };

  render() {
    const { darkMode, newWallet, activePage } = this.state;
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
                <center>
                  <p className={`${textColor}`}>
                    Each address is randomly generated.
                  </p>
                  <span
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: jdenticon.toSvg(
                        newWallet.getPrimaryAddress(),
                        150
                      )
                    }}
                  />
                </center>
                <p className={`${textColor} label`}>Your New Address:</p>
                <input
                  className="input"
                  readOnly
                  value={newWallet.getPrimaryAddress()}
                />
              </div>
            )}

            {activePage === 'secure' && (
              <p className="has-text-centered title">Secure</p>
            )}

            {activePage === 'backup' && (
              <p className="has-text-centered title">Backup</p>
            )}

            {activePage === 'verify' && (
              <p className="has-text-centered title">Verify</p>
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
                Next
              </span>
            </center>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
