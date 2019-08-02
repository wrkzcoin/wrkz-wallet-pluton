/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import { ipcRenderer } from 'electron';
import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import log from 'electron-log';
import { session, eventEmitter, loginCounter } from '../index';
import Redirector from './Redirector';

// import styles from './Send.css';

type Props = {};

export default class Login extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      importCompleted: false,
      loginInProgress: false,
      userOpenedDifferentWallet: false,
      darkMode: session.darkMode || false,
      walletFile: session.walletFile,
      wrongPassword: loginCounter.userLoginAttempted
    };
    this.handleInitialize = this.handleInitialize.bind(this);
    this.handleLoginFailure = this.handleLoginFailure.bind(this);
    this.handleLoginInProgress = this.handleLoginInProgress.bind(this);
    this.refreshLogin = this.refreshLogin.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('initializeNewSession', this.handleInitialize);
    eventEmitter.on('loginInProgress', this.handleLoginInProgress);
    eventEmitter.on('refreshLogin', this.refreshLogin);
  }

  componentWillUnmount() {
    eventEmitter.off('initializeNewSession', this.handleInitialize);
    eventEmitter.off('loginInProgress', this.handleLoginInProgress);
    eventEmitter.off('refreshLogin', this.refreshLogin);
  }

  handleLoginInProgress() {
    log.debug('Login in progress...');
    this.setState({
      loginInProgress: true
    });
  }

  handleLoginFailure() {
    this.setState({
      loginFailed: true,
      loginInProgress: false
    });
  }

  refreshLogin() {
    this.setState({
      userOpenedDifferentWallet: true
    });
  }

  handleInitialize() {
    this.setState({
      importCompleted: true
    });
  }

  async handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    loginCounter.userLoginAttempted = true;
    eventEmitter.emit('loginInProgress');
    const password = event.target[0].value;
    if (password === undefined) {
      return;
    }
    eventEmitter.emit('initializeNewSession', password);
  }

  render() {
    if (this.state.userOpenedDifferentWallet) {
      return <Redirect to="/" />;
    }
    if (this.state.importCompleted === true) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        <Redirector />
        {this.state.darkMode === false && (
          <div className="fullwindow">
            {this.state.loginInProgress === false && (
              <div className="mid-div">
                <div
                  className={
                    this.state.wrongPassword
                      ? 'box loginbox-fail has-background-light inner-div'
                      : 'box loginbox has-background-light inner-div'
                  }
                >
                  <form onSubmit={this.handleSubmit}>
                    <div className="field">
                      <label className="label" htmlFor="scanheight">
                        Password
                        <div className="control">
                          <input
                            ref={input => input && input.focus()}
                            className={
                              this.state.wrongPassword
                                ? 'input is-large is-danger'
                                : 'input is-large'
                            }
                            type="password"
                            placeholder="Enter your wallet password..."
                          />
                        </div>
                      </label>
                      <label className="help" htmlFor="scanheight">
                        attempting login to {this.state.walletFile}
                      </label>
                    </div>
                    <div className="buttons is-right">
                      <button
                        type="submit"
                        className="button is-success is-large"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {this.state.darkMode === true && (
          <div className="fullwindow has-background-dark outer-div">
            {this.state.loginInProgress === false && (
              <div className="mid-div">
                <div
                  className={
                    this.state.wrongPassword
                      ? 'box loginbox-fail has-background-black inner-div'
                      : 'box loginbox has-background-black inner-div'
                  }
                >
                  <form onSubmit={this.handleSubmit}>
                    <div className="field">
                      <label
                        className="label has-text-white"
                        htmlFor="scanheight"
                      >
                        Password
                        <div className="control">
                          <input
                            ref={input => input && input.focus()}
                            className={
                              this.state.wrongPassword
                                ? 'input is-large is-danger'
                                : 'input is-large'
                            }
                            type="password"
                            placeholder="Enter your wallet password..."
                          />
                        </div>
                      </label>
                      <label
                        className="help has-text-white"
                        htmlFor="scanheight"
                      >
                        attempting login to {this.state.walletFile}
                      </label>
                    </div>
                    <div className="buttons is-right">
                      <button
                        type="submit"
                        className="button is-success is-large"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
