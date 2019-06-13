import React from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import { config } from '../reducers/index';

export default function navBar(activePage) {
  return (
    <React-Fragment>
      <div className="box  has-background-grey-lighter headerbar">
        <div className="columns">
          <div className="column is-three-fifths">
            <nav
              className="navbar has-background-grey-lighter"
              role="navigation"
              aria-label="main navigation"
            >
              <div className="navbar-brand">
                <Link to={routes.HOME}>
                  <span className="navbar-item" href="#">
                    <img
                      src={config.logo}
                      alt="logo"
                      className="img-responsive"
                    />
                  </span>
                </Link>
                {activePage === 'wallet' && (
                  <Link to={routes.HOME}>
                    <span className="navbar-item">
                      <i className="fa fa-credit-card" />
                      &nbsp;<strong>Wallet</strong>
                    </span>
                  </Link>
                )}
                {activePage !== 'wallet' && (
                  <Link to={routes.HOME}>
                    <span className="navbar-item">
                      <i className="fa fa-credit-card" />
                      &nbsp;Wallet
                    </span>
                  </Link>
                )}
                {activePage === 'send' && (
                  <Link to={routes.SEND}>
                    <span className="navbar-item">
                      <i className="fa fa-paper-plane" />
                      &nbsp;<strong>Send</strong>
                    </span>
                  </Link>
                )}
                {activePage !== 'send' && (
                  <Link to={routes.SEND}>
                    <span className="navbar-item">
                      <i className="fa fa-paper-plane" />
                      &nbsp;Send
                    </span>
                  </Link>
                )}
                {activePage === 'receive' && (
                  <Link to={routes.COUNTER}>
                    <span className="navbar-item">
                      <i className="fa fa-arrow-circle-down" />
                      &nbsp;<strong>Receive</strong>
                    </span>
                  </Link>
                )}
                {activePage !== 'receive' && (
                  <Link to={routes.COUNTER}>
                    <span className="navbar-item">
                      <i className="fa fa-arrow-circle-down" />
                      &nbsp;Receive
                    </span>
                  </Link>
                )}
                {activePage === 'addresses' && (
                  <Link to={routes.ADDRESSES}>
                    <span className="navbar-item">
                      <i className="fa fa-address-book" />
                      &nbsp;<strong>Addresses</strong>
                    </span>
                  </Link>
                )}
                {activePage !== 'addresses' && (
                  <Link to={routes.ADDRESSES}>
                    <span className="navbar-item">
                      <i className="fa fa-address-book" />
                      &nbsp;Addresses
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
          <div className="column">
            <input
              className="input is-rounded"
              type="text"
              placeholder="Search..."
            />
          </div>
        </div>
      </div>
    </React-Fragment>
  );
}
