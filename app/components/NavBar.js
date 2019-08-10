// @flow

import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import routes from '../constants/routes';
import { session, eventEmitter, il8n } from '../index';
import uiType from '../utils/uitype';
import log from 'electron-log';

type Location = {
  hash: string,
  pathname: string,
  search: string
};

type Props = {
  location: Location
};

type State = {
  darkMode: boolean
};

class NavBar extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
  }

  componentWillUnmount() {
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeoff', this.darkModeOff);
  }

  darkModeOn = () => {
    this.setState({
      darkMode: true
    });
  };

  darkModeOff = () => {
    this.setState({
      darkMode: false
    });
  };

  render() {
    const { darkMode } = this.state;
    const {
      location: { pathname }
    } = this.props;
    const {
      backgroundColor,
      fillColor,
      textColor,
      elementBaseColor,
      settingsCogColor
    } = uiType(darkMode);

    return (
      <div>
        <div
          className={
            session.firstLoadOnLogin
              ? `headerbar-slidedown ${fillColor}`
              : `headerbar ${fillColor}`
          }
        >
          <nav
            className={`navbar ${elementBaseColor}`}
            role="navigation"
            aria-label="main navigation"
          >
            <div id="navbarBasicExample" className="navbar-menu">
              <div className="navbar-brand">
                <div className="navbar-item">
                  <img
                    src="images/icon_color_64x64.png"
                    alt="proton wallet logo in green"
                  />
                </div>
              </div>
              <div className="navbar-start">
                <Link className="navbar-item" to={routes.HOME}>
                  <i className="fa fa-credit-card" />
                  {pathname === '/' && (
                    <strong>&nbsp;&nbsp;{il8n.wallet}</strong>
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
                  {pathname !== '/receive' && <p>&nbsp;&nbsp;{il8n.receive}</p>}
                </Link>
              </div>

              <div className="navbar-end">
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
        </div>
      </div>
    );
  }
}

// $FlowFixMe
export default withRouter(NavBar);
