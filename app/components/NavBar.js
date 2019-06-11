import React from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import { config } from '../reducers/index';

export default function navBar() {
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
                <Link to={routes.HOME}>
                  <span className="navbar-item">Wallet</span>
                </Link>
                <Link to={routes.SEND}>
                  <span className="navbar-item">Send</span>
                </Link>
                <Link to={routes.COUNTER}>
                  <span className="navbar-item">Receive</span>
                </Link>
                <Link to={routes.ADDRESSES}>
                  <span className="navbar-item">Addresses</span>
                </Link>
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
