// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import routes from '../constants/routes';
import { session, eventEmitter, il8n, loginCounter, config } from '../index';
import uiType from '../utils/uitype';

type Location = {
  hash: string,
  pathname: string,
  search: string
};

type Props = {
  location: Location,
  darkMode: boolean
};

type State = {
  navBarCount: number
};

class NavBar extends Component<Props, State> {
  props: Props;

  state: State;

  activityTimer: IntervalID;

  constructor(props?: Props) {
    super(props);
    this.state = {
      navBarCount: loginCounter.navBarCount
    };
    this.logOut = this.logOut.bind(this);
  }

  componentDidMount() {
    loginCounter.navBarCount++;
  }

  componentWillUnmount() {
    if (session.walletPassword !== '') {
      clearInterval(this.activityTimer);
    }
  }

  logOut = () => {
    eventEmitter.emit('logOut');
  };

  render() {
    // prettier-ignore
    const { location: { pathname }, darkMode } = this.props;
    const { navBarCount } = this.state;
    const { fillColor, elementBaseColor, settingsCogColor } = uiType(darkMode);
    const { useLocalDaemon } = config;

    return (
      <div>
        <div
          className={
            navBarCount > 0
              ? `headerbar ${fillColor}`
              : `headerbar-slidedown ${fillColor}`
          }
        >
          {loginCounter.isLoggedIn && (
            <nav
              className={`navbar ${elementBaseColor}`}
              role="navigation"
              aria-label="main navigation"
            >
              <div className="navbar-menu">
                <div className="navbar-brand">
                  <div className="navbar-item">
                    <img
                      src="images/icon_color_64x64.png"
                      alt="proton wallet logo in green"
                    />
                  </div>
                </div>
                <div className="navbar-start">
                  <Link to={routes.HOME} className="navbar-item">
                    <i className="fa fa-credit-card" />
                    {pathname === '/' && (
                      <p className="sans">
                        <strong>&nbsp;&nbsp;{il8n.wallet}</strong>
                      </p>
                    )}
                    {pathname !== '/' && <p>&nbsp;&nbsp;{il8n.wallet}</p>}
                  </Link>

                  <Link className="navbar-item" to={routes.SEND}>
                    <i className="fa fa-paper-plane" />
                    {pathname === '/send' && (
                      <strong>&nbsp;&nbsp;{il8n.send}</strong>
                    )}
                    {pathname !== '/send' && <p>&nbsp;&nbsp;{il8n.send}</p>}
                  </Link>

                  <Link className="navbar-item" to={routes.RECEIVE}>
                    <i className="fa fa-arrow-circle-down" />
                    {pathname === '/receive' && (
                      <strong>&nbsp;&nbsp;{il8n.receive}</strong>
                    )}
                    {pathname !== '/receive' && (
                      <p>&nbsp;&nbsp;{il8n.receive}</p>
                    )}
                  </Link>
                  {useLocalDaemon && (
                    <Link className="navbar-item" to={routes.TERMINAL}>
                      <i className="fas fa-terminal" />
                      {pathname === '/terminal' && (
                        <strong>&nbsp;&nbsp;Terminal</strong>
                      )}
                      {pathname !== '/terminal' && <p>&nbsp;&nbsp;Terminal</p>}
                    </Link>
                  )}
                </div>
                <div className="navbar-end">
                  {session.walletPassword !== '' && (
                    <div className="navbar-item">
                      <Link className="buttons" to={routes.LOGIN}>
                        <span
                          className="button icon is-large is-danger"
                          onClick={this.logOut}
                          onKeyPress={this.logOut}
                          role="button"
                          tabIndex={0}
                        >
                          <i className="fa fa-lock" />
                        </span>
                      </Link>
                    </div>
                  )}
                  <div className="navbar-item">
                    <Link className="buttons" to={routes.SETTINGS}>
                      <span
                        className={`button icon is-large ${settingsCogColor}`}
                      >
                        <i className="fa fa-cog" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          )}
          {!loginCounter.isLoggedIn && (
            <nav
              className={`navbar ${elementBaseColor}`}
              role="navigation"
              aria-label="main navigation"
            >
              <div className="navbar-menu">
                <div className="navbar-brand" />
                <div className="navbar-end">
                  <div className="navbar-item">
                    <Link className="buttons" to={routes.SETTINGS}>
                      <span className="icon button is-large is-danger">
                        <i className="fas fa-chevron-left" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    );
  }
}

// $FlowFixMe
export default withRouter(NavBar);
