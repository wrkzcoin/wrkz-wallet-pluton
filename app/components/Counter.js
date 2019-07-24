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
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      importkey: false,
      importseed: false,
      nodeFee: session.daemon.feeAmount,
      changePassword: false,
      loginFailed: false,
      gohome: false,
      darkMode: session.darkMode,
      firstLoad: session.firstLoadOnLogin
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.refreshBalanceOnNewTransaction = this.refreshBalanceOnNewTransaction.bind(
      this
    );
    this.handleInitialize = this.handleInitialize.bind(this);
  }

  componentDidMount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.on('transaction', this.refreshBalanceOnNewTransaction);
    }
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
    eventEmitter.on('openNewWallet', this.handleInitialize);
    this.turnOffFirstLoad();
  }

  componentWillUnmount() {
    if (session.wallet !== undefined) {
      session.wallet.setMaxListeners(1);
      session.wallet.off('transaction', this.refreshBalanceOnNewTransaction);
    }
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

  async turnOffFirstLoad() {
    session.firstLoadOnLogin = false;
    this.setState({
      firstLoad: false
    });
  }

  refreshBalanceOnNewTransaction() {
    log.debug('Transaction found, refreshing balance...');
    this.setState({
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance()
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

  handleCopyAddressToClipboard(text: string = session.address) {
    return (dispatch: Dispatch) => {
      log.debug(`Address copied to clipboard ${text}`);
      clipboard.writeText(text);
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
    if (this.state.gohome === true) {
      return <Redirect to="/" />;
    }

    const balanceTooltip =
      `Unlocked: ${session.atomicToHuman(
        this.state.unlockedBalance,
        true
      )} TRTL<br>` +
      `Locked: ${session.atomicToHuman(this.state.lockedBalance, true)} TRTL`;

    const syncTooltip =
      session.wallet.getSyncStatus()[2] === 0
        ? 'Connecting, please wait...'
        : `${session.wallet.getSyncStatus()[0]}/${
            session.wallet.getSyncStatus()[2]
          }`;

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
            <div className="footerbar has-background-light">
              <div className="field is-grouped is-grouped-multiline is-grouped-right">
                {this.state.nodeFee > 0 && (
                  <div className="control statusicons">
                    <div className="tags has-addons">
                      <span className="tag  is-white is-large">Node Fee:</span>
                      <span className="tag is-danger is-large">
                        {session.atomicToHuman(this.state.nodeFee, true)} TRTL
                      </span>
                    </div>
                  </div>
                )}
                <div className="control statusicons">
                  <div className="tags has-addons">
                    <span className="tag is-white is-large">Sync:</span>
                    {this.state.syncStatus < 100 &&
                      session.daemon.networkBlockCount !== 0 && (
                        <span
                          className="tag is-warning is-large"
                          data-tip={syncTooltip}
                        >
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
                        <span
                          className="tag is-success is-large"
                          data-tip={syncTooltip}
                        >
                          {this.state.syncStatus}%
                        </span>
                      )}
                    {session.daemon.networkBlockCount === 0 && (
                      <span
                        className="tag is-danger is-large"
                        data-tip={syncTooltip}
                      >
                        <ReactLoading
                          type="spinningBubbles"
                          color="#F5F5F5"
                          height={30}
                          width={30}
                        />
                      </span>
                    )}
                  </div>
                </div>
                <div className="control statusicons">
                  <div className="tags has-addons">
                    <span className="tag is-white is-large">Balance:</span>
                    <span
                      className={
                        this.state.lockedBalance > 0
                          ? 'tag is-warning is-large'
                          : 'tag is-info is-large'
                      }
                      data-tip={balanceTooltip}
                    >
                      {this.state.lockedBalance > 0 ? (
                        <i className="fa fa-lock" />
                      ) : (
                        <i className="fa fa-unlock" />
                      )}
                      &nbsp;
                      {session.atomicToHuman(
                        this.state.unlockedBalance + this.state.lockedBalance,
                        true
                      )}
                      &nbsp;TRTL
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="footerbar has-background-black">
              <div className="field is-grouped is-grouped-multiline is-grouped-right">
                {this.state.nodeFee > 0 && (
                  <div className="control statusicons">
                    <div className="tags has-addons">
                      <span className="tag is-large is-dark">Node Fee:</span>
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
                        <span
                          className="tag is-warning is-large"
                          data-tip={syncTooltip}
                        >
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
                        <span
                          className="tag is-success is-large"
                          data-tip={syncTooltip}
                        >
                          {this.state.syncStatus}%
                        </span>
                      )}
                    {session.daemon.networkBlockCount === 0 && (
                      <span
                        className="tag is-danger is-large"
                        data-tip={syncTooltip}
                      >
                        <ReactLoading
                          type="spinningBubbles"
                          color="#F5F5F5"
                          height={30}
                          width={30}
                        />
                      </span>
                    )}
                  </div>
                </div>
                <div className="control statusicons">
                  <div className="tags has-addons">
                    <span className="tag is-dark is-large">Balance:</span>
                    <span
                      className={
                        this.state.lockedBalance > 0
                          ? 'tag is-warning is-large'
                          : 'tag is-info is-large'
                      }
                      data-tip={balanceTooltip}
                    >
                      {this.state.lockedBalance > 0 ? (
                        <i className="fa fa-lock" />
                      ) : (
                        <i className="fa fa-unlock" />
                      )}
                      &nbsp;
                      {session.atomicToHuman(
                        this.state.unlockedBalance + this.state.lockedBalance,
                        true
                      )}
                      &nbsp;TRTL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
