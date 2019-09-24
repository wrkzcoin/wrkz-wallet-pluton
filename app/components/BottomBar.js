// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { session, loginCounter, config } from '../index';
import SyncStatus from './SyncStatus';
import DaemonSyncStatus from './DaemonSyncStatus';
import Balance from './Balance';
import NodeFee from './NodeFee';
import uiType from '../utils/uitype';

type Location = {
  hash: string,
  pathname: string,
  search: string
};

type Props = {
  location: Location,
  darkMode: boolean
};

type State = {
  navBarCount: number
};

class BottomBar extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      navBarCount: loginCounter.navBarCount
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    // prettier-ignore
    const { darkMode } = this.props;
    const { navBarCount } = this.state;
    const { useLocalDaemon } = config;
    const { toolTipColor } = uiType(darkMode);

    return (
      <div
        className={
          // eslint-disable-next-line no-nested-ternary
          darkMode
            ? navBarCount > 0
              ? 'footerbar has-background-black'
              : 'footerbar-slideup has-background-black'
            : navBarCount > 0
            ? 'footerbar has-background-light'
            : 'footerbar-slideup has-background-light'
        }
      >
        <ReactTooltip
          effect="solid"
          type={toolTipColor}
          multiline
          place="top"
        />
        {session.wallet && (
          <div className="field is-grouped is-grouped-multiline is-grouped-right">
            {}
            <NodeFee size="is-large" darkMode={darkMode} />
            {useLocalDaemon && (
              <DaemonSyncStatus size="is-large" darkMode={darkMode} />
            )}
            <SyncStatus size="is-large" darkMode={darkMode} />
            <Balance size="is-large" darkMode={darkMode} />
          </div>
        )}
      </div>
    );
  }
}

// $FlowFixMe
export default withRouter(BottomBar);
