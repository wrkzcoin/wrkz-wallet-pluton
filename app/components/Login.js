// @flow
import React, { Component } from 'react';
import { session, eventEmitter, loginCounter, il8n } from '../index';
import Redirector from './Redirector';
import uiType from '../utils/uitype';


type Props = {};

type State = {
  darkMode: boolean,
  walletFile: string,
  wrongPassword: boolean
};

export default class Login extends Component<Props, State> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode || false,
      walletFile: session.walletFile,
      wrongPassword: loginCounter.userLoginAttempted
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  async handleSubmit(event: any) {
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
    const { darkMode, wrongPassword, walletFile } = this.state;
    const { backgroundColor, fillColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`fullwindow outer-div ${backgroundColor}`}>
          <div className="mid-div">
            <div
              className={
                wrongPassword
                  ? `box loginbox-fail inner-div ${fillColor}`
                  : `box loginbox inner-div ${fillColor}`
              }
            >
              <form onSubmit={this.handleSubmit}>
                <div className="field">
                  <label className={`label ${textColor}`} htmlFor="scanheight">
                    {il8n.password}
                    <div className="control">
                      <input
                        ref={input => input && input.focus()}
                        className={
                          wrongPassword
                            ? 'input is-large is-danger'
                            : 'input is-large'
                        }
                        type="password"
                        placeholder={il8n.password_input_placeholder}
                      />
                    </div>
                  </label>
                  <label className={`help ${textColor}`} htmlFor="scanheight">
                    {il8n.attempting_login_to}
                    {walletFile}
                  </label>
                </div>
                <div className="buttons is-right">
                  <button type="submit" className="button is-success is-large">
                    {il8n.login}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
