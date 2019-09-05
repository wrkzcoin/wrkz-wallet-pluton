// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { config, session, eventEmitter } from '../index';

type Props = {};

type State = {
  selectedTimeout: number,
  timeoutEnabled: boolean
};

export default class TimeoutSelector extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      selectedTimeout: config.autoLockInterval,
      timeoutEnabled: config.autoLockEnabled
    };
    this.handleTimeoutChange = this.handleTimeoutChange.bind(this);
    this.disableTimeout = this.disableTimeout.bind(this);
    this.enableTimeout = this.enableTimeout.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  disableTimeout = () => {
    this.setState({
      timeoutEnabled: false
    });
    session.modifyConfig('autoLockEnabled', false);
    eventEmitter.emit('setAutoLock', false);
  };

  enableTimeout = () => {
    this.setState({
      timeoutEnabled: true
    });
    session.modifyConfig('autoLockEnabled', true);
    eventEmitter.emit('setAutoLock', true);
  };

  handleTimeoutChange = (event: any) => {
    event.preventDefault();
    const timeout: string = event.target.value;
    const regex = /^\d*(\.(\d\d?)?)?$/;
    if (!regex.test(timeout) === true) {
      return;
    }
    this.setState({
      selectedTimeout: event.target.value
    });
  };

  updateTimeoutInConfig(event: any) {
    event.preventDefault();
    if (event.target[0].value === '' || event.target[0].value === '0') {
      return;
    }
    const interval: number = Number(event.target[0].value);
    if (interval) session.modifyConfig('autoLockInterval', interval);
    eventEmitter.emit('newLockInterval', interval);
  }

  render() {
    const { selectedTimeout, timeoutEnabled } = this.state;
    return (
      <form onSubmit={this.updateTimeoutInConfig}>
        <div className="columns">
          <div className="column is-three-quarters">
            <div className="field has-addons">
              <div className="control is-expanded">
                <input
                  className="input"
                  type="text"
                  value={selectedTimeout}
                  onChange={this.handleTimeoutChange}
                  disabled={!timeoutEnabled}
                />
              </div>
              <div className="control">
                <button
                  className="button is-success"
                  disabled={!timeoutEnabled}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
          <div className="column is-one-quarter">
            {timeoutEnabled && (
              <button className="button" onClick={this.disableTimeout}>
                Disable
              </button>
            )}
            {!timeoutEnabled && (
              <button className="button" onClick={this.enableTimeout}>
                Enable
              </button>
            )}
          </div>
        </div>
      </form>
    );
  }
}
