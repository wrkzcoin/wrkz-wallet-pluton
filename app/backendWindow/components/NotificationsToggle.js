// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { session, config } from '../index';
import uiType from '../utils/uitype';

type State = {
  notifications: boolean
};

type Props = {
  darkMode: boolean
};

export default class NotificationsToggle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      notifications: config.notifications || false
    };
    this.toggle = this.toggle.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  toggle = () => {
    const { notifications } = this.state;

    session.modifyConfig('notifications', !notifications);
    this.setState({
      notifications: !notifications
    });
  };

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { notifications } = this.state;
    return (
      <div>
        {notifications === false && (
          <span className={textColor}>
            <a
              className="button is-danger"
              onClick={this.toggle}
              onKeyPress={this.toggle}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fas fa-times" />
              </span>
            </a>
            &nbsp;&nbsp; Notifications: <b>Off</b>
          </span>
        )}
        {notifications === true && (
          <span className={textColor}>
            <a
              className="button is-success"
              onClick={this.toggle}
              onKeyPress={this.toggle}
              role="button"
              tabIndex={0}
            >
              <span className="icon is-large">
                <i className="fa fa-check" />
              </span>
            </a>
            &nbsp;&nbsp; Notifications: <b>On</b> &nbsp;&nbsp;
          </span>
        )}
      </div>
    );
  }
}
