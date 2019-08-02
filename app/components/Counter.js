// @flow
import { ipcRenderer } from 'electron';
import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import { Redirect } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';

type Props = {
  copyToClipboard: () => void,
};

export default class Receive extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      nodeFee: session.daemon.feeAmount,
      darkMode: session.darkMode,
      firstLoad: session.firstLoadOnLogin,
      gohome: false
    };
    this.handleInitialize = this.handleInitialize.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('openNewWallet', this.handleInitialize);
    eventEmitter.on('loginFailed', this.handleLoginFailure);
  }

  componentWillUnmount() {
    eventEmitter.off('openNewWallet', this.handleInitialize);
    eventEmitter.off('loginFailed', this.handleLoginFailure);
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

  render() {
    const { copyToClipboard } = this.props;

    if (this.state.gohome === true) {
      return <Redirect to="/" />;
    }

    if (this.state.loginFailed === true) {
      return <Redirect to="/login" />;
    }

    return (

      <div>
        <Redirector />
        {this.state.darkMode === false && (
          <div className="wholescreen">
            <ReactTooltip
              effect="solid"
              border
              type="dark"
              multiline
              place="top"
            />
            <NavBar />
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
            <NavBar />
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
