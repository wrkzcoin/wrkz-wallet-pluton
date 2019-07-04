import React from 'react';
import { Link } from 'react-router-dom';
import log from 'electron-log';
import routes from '../constants/routes';
import { config } from '../index';

export default function navBar(activePage) {
  return (
    <React-Fragment>
      <div className="box has-background-grey-lighter headerbar">
        {activePage !== 'login' && (
          <div className="columns">
            <div className="column is-three-fifths">
              <nav
                className="navbar has-background-grey-lighter"
                role="navigation"
                aria-label="main navigation"
              >
                <div className="navbar-brand">
                  {activePage === 'wallet' && (
                    <Link to={routes.HOME}>
                      <span className="navbar-item navbarlink is-active">
                        <i className="fa fa-credit-card" />
                        &nbsp;&nbsp;<strong>Wallet</strong>
                      </span>
                    </Link>
                  )}
                  {activePage !== 'wallet' && (
                    <Link to={routes.HOME}>
                      <span className="navbar-item navbarlink">
                        <i className="fa fa-credit-card" />
                        &nbsp;&nbsp;Wallet
                      </span>
                    </Link>
                  )}
                  {activePage === 'send' && (
                    <Link to={routes.SEND}>
                      <span className="navbar-item navbarlink is-active">
                        <i className="fa fa-paper-plane" />
                        &nbsp;&nbsp;<strong>Send</strong>
                      </span>
                    </Link>
                  )}
                  {activePage !== 'send' && (
                    <Link to={routes.SEND}>
                      <span className="navbar-item navbarlink">
                        <i className="fa fa-paper-plane" />
                        &nbsp;&nbsp;Send
                      </span>
                    </Link>
                  )}
                  {activePage === 'receive' && (
                    <Link to={routes.COUNTER}>
                      <span className="navbar-item navbarlink is-active">
                        <i className="fa fa-arrow-circle-down" />
                        &nbsp;&nbsp;<strong>Receive</strong>
                      </span>
                    </Link>
                  )}
                  {activePage !== 'receive' && (
                    <Link to={routes.COUNTER}>
                      <span className="navbar-item navbarlink">
                        <i className="fa fa-arrow-circle-down" />
                        &nbsp;&nbsp;Receive
                      </span>
                    </Link>
                  )}
                  {activePage === 'donotshow' && (
                    <Link to={routes.ADDRESSES}>
                      <span className="navbar-item navbarlink">
                        <i className="fa fa-address-book" />
                        &nbsp;&nbsp;<strong>Addresses</strong>
                      </span>
                    </Link>
                  )}
                  {activePage === 'donotshow' && (
                    <Link to={routes.IMPORTKEY}>
                      <span className="navbar-item navbarlink">
                        <i className="fa fa-address-book" />
                        &nbsp;&nbsp;Addresses
                      </span>
                    </Link>
                  )}
                  <Link to={routes.HOME} />
                </div>
              </nav>
            </div>
            <div className="column is-one-third">
              {activePage === 'donotshow' && (
                <input
                  className="input searchbar"
                  type="text"
                  placeholder="Search..."
                />
              )}
            </div>
            <div className="column">
              <Link to={routes.SETTINGS}>
                {activePage !== 'settings' && (
                  <span className="navbar-item settingscog navbarlink">
                    <i className="fa fa-cog" />
                    &nbsp;
                  </span>
                )}
                {activePage === 'settings' && (
                  <span className="navbar-item settingscog navbarlink is-active">
                    <i className="fa fa-cog" />
                    &nbsp;
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
        <center>
          {activePage === 'login' && (
            <h1 className="title has-text-grey-darker">

            </h1>
          )}
        </center>
      </div>
    </React-Fragment>
  );
}
