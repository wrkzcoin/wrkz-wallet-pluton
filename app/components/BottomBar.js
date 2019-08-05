// @flow
import React, { Component } from 'react';
import { session, eventEmitter } from '../index';
import SyncStatus from './SyncStatus';
import Balance from './Balance';
import NodeFee from './NodeFee';

type Props = {};

type State = {
  darkmode: boolean
};

export default class BottomBar extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkmode: session.darkMode
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
      darkmode: true
    });
  };

  darkModeOff = () => {
    this.setState({
      darkmode: false
    });
  };

  render() {
    const { darkmode } = this.state;
    return (
      <div
        className={
          // eslint-disable-next-line no-nested-ternary
          darkmode
            ? session.firstLoadOnLogin
              ? 'footerbar-slideup has-background-black'
              : 'footerbar has-background-black'
            : session.firstLoadOnLogin
            ? 'footerbar-slideup has-background-light'
            : 'footerbar has-background-light'
        }
      >
        <div className="field is-grouped is-grouped-multiline is-grouped-right">
          <NodeFee />
          <SyncStatus />
          <Balance />
        </div>
      </div>
    );
  }
}
