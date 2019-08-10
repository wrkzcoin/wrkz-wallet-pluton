// @flow
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { session, eventEmitter } from '../index';
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
  darkmode: boolean
};

class BottomBar extends Component<Props, State> {
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
    // prettier-ignore
    const { location: { pathname } } = this.props;
    const { darkmode } = this.state;

    return (
      <div
        className={
          // eslint-disable-next-line no-nested-ternary
          darkmode
            ? session.firstLoadOnLogin && pathname === '/'
              ? 'footerbar-slideup has-background-black'
              : 'footerbar has-background-black'
            : session.firstLoadOnLogin && pathname === '/'
            ? 'footerbar-slideup has-background-light'
            : 'footerbar has-background-light'
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
