import React from 'react';
import { Link } from 'react-router-dom';
import log from 'electron-log';
import routes from '../constants/routes';
import { config, session } from '../index';

export default function navBar(activePage, isDarkMode) {
  return (
    <React-Fragment>
      <div>
        {isDarkMode === false && (
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
                <div className="navbar-start">
                  <Link className="navbar-item" to={routes.HOME}>
                    <i className="fa fa-credit-card" />
                    {activePage === 'wallet' && (
                      <strong>&nbsp;&nbsp;Wallet</strong>
                    )}
                    {activePage !== 'wallet' && <p>&nbsp;&nbsp;Wallet</p>}
                  </Link>

                  <Link className="navbar-item" to={routes.SEND}>
                    <i className="fa fa-paper-plane" />
                    {activePage === 'send' && <strong>&nbsp;&nbsp;Send</strong>}
                    {activePage !== 'send' && <p>&nbsp;&nbsp;Send</p>}
                  </Link>

                  <Link className="navbar-item" to={routes.COUNTER}>
                    <i className="fa fa-arrow-circle-down" />
                    {activePage === 'receive' && (
                      <strong>&nbsp;&nbsp;Receive</strong>
                    )}
                    {activePage !== 'receive' && <p>&nbsp;&nbsp;Receive</p>}
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
        {isDarkMode === true && (
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
                <div className="navbar-start">
                  <Link className="navbar-item" to={routes.HOME}>
                    <i className="fa fa-credit-card" />
                    {activePage === 'wallet' && (
                      <strong>&nbsp;&nbsp;Wallet</strong>
                    )}
                    {activePage !== 'wallet' && <p>&nbsp;&nbsp;Wallet</p>}
                  </Link>

                  <Link className="navbar-item" to={routes.SEND}>
                    <i className="fa fa-paper-plane" />
                    {activePage === 'send' && <strong>&nbsp;&nbsp;Send</strong>}
                    {activePage !== 'send' && <p>&nbsp;&nbsp;Send</p>}
                  </Link>

                  <Link className="navbar-item" to={routes.COUNTER}>
                    <i className="fa fa-arrow-circle-down" />
                    {activePage === 'receive' && (
                      <strong>&nbsp;&nbsp;Receive</strong>
                    )}
                    {activePage !== 'receive' && <p>&nbsp;&nbsp;Receive</p>}
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
