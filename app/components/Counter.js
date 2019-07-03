// @flow
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import QRCode from 'qrcode.react';
import { Redirect, Link } from 'react-router-dom';
import clipboardy from 'clipboardy';
import { config, session, eventEmitter } from '../index';
import navBar from './NavBar';
import routes from '../constants/routes';

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
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions(),
      importkey: false,
      importseed: false,
      nodeFee: session.daemon.feeAmount,
      changePassword: false,
      loginFailed: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
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

  handleCopyAddressToClipboard(text: string = session.address) {
    return (dispatch: Dispatch) => {
      log.debug(`Address copied to clipboard ${text}`);
      clipboardy.writeSync(text);
    };
  }

  handlePasswordChange() {
    this.setState({
      changePassword: true
    });
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus()
    }));
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

    return (
      <div>
        {navBar('receive')}
        <div className="notification width maincontent">
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
              <br />
              <center>
                <span>
                  <QRCode
                    value={session.address}
                    renderAs="svg"
                    bgColor="#f5f5f5"
                    size={248}
                  />
                </span>
              </center>
            </div>
          </div>
        </div>
        <div className="box has-background-grey-lighter footerbar">
          <div className="field is-grouped is-grouped-multiline is-grouped-right">
            {this.state.nodeFee > 0 && (
              <div className="control statusicons">
                <div className="tags has-addons">
                  <span className="tag is-dark is-large">Node Fee:</span>
                  <span className="tag is-danger is-large">
                    {session.atomicToHuman(this.state.nodeFee, true)} TRTL
                  </span>
                </div>
              </div>
            )}
            <div className="control statusicons">
              <div className="tags has-addons">
                <span className="tag is-dark is-large">Sync:</span>
                {this.state.syncStatus < 100 &&
                  session.daemon.networkBlockCount !== 0 && (
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
                {this.state.syncStatus === 100 &&
                  session.daemon.networkBlockCount !== 0 && (
                    <span className="tag is-success is-large">
                      {this.state.syncStatus}%
                    </span>
                  )}
                {session.daemon.networkBlockCount === 0 && (
                  <span className="tag is-danger is-large">Node Offline</span>
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
