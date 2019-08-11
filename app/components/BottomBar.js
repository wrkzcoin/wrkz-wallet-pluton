// @flow
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { session, eventEmitter, loginCounter } from '../index';
import SyncStatus from './SyncStatus';
import Balance from './Balance';
import NodeFee from './NodeFee';

type Location = {
  hash: string,
  pathname: string,
  search: string
};

type Props = {
  location: Location
};

type State = {
  darkmode: boolean,
  navBarCount: number
};

class BottomBar extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkmode: session.darkMode,
      navBarCount: loginCounter.navBarCount
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
    // prettier-ignore
    const { darkmode, navBarCount } = this.state;

    return (
      <div
        className={
          // eslint-disable-next-line no-nested-ternary
          darkmode
            ? navBarCount > 0
              ? 'footerbar has-background-black'
              : 'footerbar-slideup has-background-black'
            : navBarCount > 0
            ? 'footerbar has-background-light'
            : 'footerbar-slideup has-background-light'
        }
      >
        {session.wallet && (
          <div className="field is-grouped is-grouped-multiline is-grouped-right">
            <NodeFee />
            <SyncStatus />
            <Balance />
          </div>
        )}
      </div>
    );
  }
}

// $FlowFixMe
export default withRouter(BottomBar);
