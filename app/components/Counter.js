// @flow
import { ipcRenderer, clipboard } from 'electron';
import log from 'electron-log';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import QRCode from 'qrcode.react';
import { Redirect } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { sync } from 'glob';
import { session, eventEmitter } from '../index';
import navBar from './NavBar';
import BottomBar from './BottomBar';


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Props = {
  increment: () => void,
  incrementIfOdd: () => void,
  incrementAsync: () => void,
  decrement: () => void,
  counter: number,
  copyToClipboard: () => void,
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>
};

export default class Receive extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      nodeFee: session.daemon.feeAmount,
      darkMode: session.darkMode,
      firstLoad: session.firstLoadOnLogin,
      importkey: false,
      importseed: false,
      changePassword: false,
      loginFailed: false,
      gohome: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handleInitialize = this.handleInitialize.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('openNewWallet', this.handleInitialize);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
    eventEmitter.off('openNewWallet', this.handleInitialize);
  }

  handleInitialize() {
    this.setState({
      gohome: true
    });
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true
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

  render() {
    const {
      increment,
      incrementIfOdd,
      incrementAsync,
      decrement,
      counter,
      copyToClipboard
    } = this.props;
    if (this.state.changePassword === true) {
      return <Redirect to="/changepassword" />;
    }
    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }
    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }
    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }
    if (this.state.gohome === true) {
      return <Redirect to="/" />;
    }

    return (
      <div>
        {this.state.darkMode === false && (
          <div className="wholescreen">
            <ReactTooltip
              effect="solid"
              border
              type="dark"
              multiline
              place="top"
            />
            {navBar('receive', false)}
            <div className="maincontent">
              <div className="columns">
                <div className="column is-three-quarters">
                  <form>
                    <div className="field">
                      <label className="label" htmlFor="receiveaddress">
                        Receiving Address
                        <textarea
                          className="textarea is-family-monospace is-large"
                          rows="6"
                          value={session.address}
                          id="receiveaddress"
                          readOnly
                        />
                      </label>
                    </div>
                    <div className="field">
                      <div className="buttons">
                        <button
                          type="button"
                          className="button is-success is-large"
                          onClick={() => copyToClipboard(session.address)}
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label">
                      QR Code
                      <div className="box has-background-light">
                        <center>
                          <span>
                            <QRCode
                              value={session.address}
                              renderAs="svg"
                              bgColor="#f5f5f5"
                              size={200}
                            />
                          </span>
                        </center>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <BottomBar />
          </div>
        )}
        {this.state.darkMode === true && (
          <div className="wholescreen has-background-dark">
            <ReactTooltip
              effect="solid"
              border
              type="light"
              multiline
              place="top"
            />
            {navBar('receive', true)}
            <div className="maincontent has-background-dark">
              <div className="columns">
                <div className="column is-three-quarters">
                  <form>
                    <div className="field">
                      <label
                        className="label has-text-white"
                        htmlFor="receiveaddress"
                      >
                        Receiving Address
                        <textarea
                          className="textarea is-family-monospace is-large"
                          rows="6"
                          value={session.address}
                          id="receiveaddress"
                          readOnly
                        />
                      </label>
                    </div>
                    <div className="field">
                      <div className="buttons">
                        <button
                          type="button"
                          className="button is-success is-large"
                          onClick={() => copyToClipboard(session.address)}
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label has-text-white">
                      QR Code
                      <div className="box has-background-light">
                        <center>
                          <span>
                            <QRCode
                              value={session.address}
                              renderAs="svg"
                              bgColor="#f5f5f5"
                              size={200}
                            />
                          </span>
                        </center>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <BottomBar />
          </div>
        )}
      </div>
    );
  }
}
