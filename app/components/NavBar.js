import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import { session, eventEmitter } from '../index';

export default class NavBar extends Component<props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkmode: session.darkMode,
      activepage: 'home'
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeon', this.darkModeOff);
  }

  componentWillUnmount() {
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeon', this.darkModeOff);
  }

  darkModeOn() {
    this.setState({
      darkmode: true
    });
  }

  darkModeOff() {
    this.setState({
      darkmode: false
    });
  }

  render() {
    return (
      <React-Fragment>
        <div>
          {this.state.darkmode === false && (
            <div
              className={
                session.firstLoadOnLogin
                  ? 'headerbar-slidedown has-background-light'
                  : 'headerbar has-background-light'
              }
            >
              <nav
                className="navbar is-light"
                role="navigation"
                aria-label="main navigation"
              >
                <div id="navbarBasicExample" className="navbar-menu">
                  <div className="navbar-brand">
                    <div className="navbar-item">
                      <img
                        src="images/icon_black_64x64.png"
                        alt="proton logo"
                      />
                    </div>
                  </div>
                  <div className="navbar-start">
                    <Link className="navbar-item" to={routes.HOME}>
                      <i className="fa fa-credit-card" />
                      {this.state.activepage === 'wallet' && (
                        <strong>&nbsp;&nbsp;Wallet</strong>
                      )}
                      {this.state.activepage !== 'wallet' && <p>&nbsp;&nbsp;Wallet</p>}
                    </Link>

                    <Link className="navbar-item" to={routes.SEND}>
                      <i className="fa fa-paper-plane" />
                      {this.state.activepage === 'send' && (
                        <strong>&nbsp;&nbsp;Send</strong>
                      )}
                      {this.state.activepage !== 'send' && <p>&nbsp;&nbsp;Send</p>}
                    </Link>

                    <Link className="navbar-item" to={routes.COUNTER}>
                      <i className="fa fa-arrow-circle-down" />
                      {this.state.activepage === 'receive' && (
                        <strong>&nbsp;&nbsp;Receive</strong>
                      )}
                      {this.state.activepage !== 'receive' && <p>&nbsp;&nbsp;Receive</p>}
                    </Link>
                  </div>

                  <div className="navbar-end">
                    <div className="navbar-item">
                      <Link className="buttons" to={routes.SETTINGS}>
                        <span className="button icon is-large">
                          <i className="fa fa-cog" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          )}
          {this.state.darkmode === true && (
            <div
              className={
                session.firstLoadOnLogin
                  ? 'headerbar-slidedown has-background-black'
                  : 'headerbar has-background-black'
              }
            >
              {' '}
              <nav
                className="navbar is-black"
                role="navigation"
                aria-label="main navigation"
              >
                <div id="navbarBasicExample" className="navbar-menu">
                  <div className="navbar-brand">
                    <div className="navbar-item">
                      <img src="images/icon_color_64x64.png" />
                    </div>
                  </div>
                  <div className="navbar-start">
                    <Link className="navbar-item" to={routes.HOME}>
                      <i className="fa fa-credit-card" />
                      {this.state.activepage === 'wallet' && (
                        <strong>&nbsp;&nbsp;Wallet</strong>
                      )}
                      {this.state.activepage !== 'wallet' && <p>&nbsp;&nbsp;Wallet</p>}
                    </Link>

                    <Link className="navbar-item" to={routes.SEND}>
                      <i className="fa fa-paper-plane" />
                      {this.state.activepage === 'send' && (
                        <strong>&nbsp;&nbsp;Send</strong>
                      )}
                      {this.state.activepage !== 'send' && <p>&nbsp;&nbsp;Send</p>}
                    </Link>

                    <Link className="navbar-item" to={routes.COUNTER}>
                      <i className="fa fa-arrow-circle-down" />
                      {this.state.activepage === 'receive' && (
                        <strong>&nbsp;&nbsp;Receive</strong>
                      )}
                      {this.state.activepage !== 'receive' && <p>&nbsp;&nbsp;Receive</p>}
                    </Link>
                  </div>

                  <div className="navbar-end">
                    <div className="navbar-item">
                      <Link className="buttons" to={routes.SETTINGS}>
                        <span className="button icon is-large is-dark">
                          <i className="fa fa-cog" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </React-Fragment>
    );
  }
}
