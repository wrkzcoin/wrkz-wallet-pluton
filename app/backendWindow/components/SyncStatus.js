// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import ReactTooltip from 'react-tooltip';
import { session } from '../index';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  syncStatus: number
};

export default class SyncStatus extends Component<Props, State> {
  props: Props;

  state: State;

  syncInterval: IntervalID;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus()
    };
    this.syncInterval = setInterval(() => this.refresh(), 1000);
  }

  componentDidMount() {}

  componentWillUnmount() {
    clearInterval(this.syncInterval);
  }

  refresh() {
    this.setState(() => ({
      syncStatus: session.getSyncStatus()
    }));
    ReactTooltip.rebuild();
  }

  render() {
    const { syncStatus } = this.state;
    const { darkMode, size } = this.props;
    const color = darkMode ? 'is-dark' : 'is-white';

    let syncTooltip;

    if (session.wallet) {
      syncTooltip =
        session.wallet.getSyncStatus()[2] === 0
          ? 'Connecting, please wait...'
          : `${session.wallet.getSyncStatus()[0]}/${
              session.wallet.getSyncStatus()[2]
            }`;
    } else {
      syncTooltip = 'No wallet open!';
    }
    return (
      <div className="control statusicons">
        <div className="tags has-addons">
          <span
            className={
              darkMode ? `tag ${color} ${size}` : `tag ${color} ${size}`
            }
          >
            Sync:
          </span>
          {syncStatus < 100 && session.daemon.networkBlockCount !== 0 && (
            <span
              className={`tag is-warning ${size} sync-status`}
              data-tip={syncTooltip}
            >
              {syncStatus}%
              <ReactLoading
                type="bubbles"
                color="#363636"
                height={30}
                width={30}
              />
            </span>
          )}
          {syncStatus === 100 && session.daemon.networkBlockCount !== 0 && (
            <span
              className={`tag is-success ${size} sync-status`}
              data-tip={syncTooltip}
            >
              {syncStatus}%
            </span>
          )}
          {session.daemon.networkBlockCount === 0 && (
            <span
              className={`tag is-danger ${size} sync-status`}
              data-tip={syncTooltip}
            >
              <ReactLoading
                type="spinningBubbles"
                color="#F5F5F5"
                height={25}
                width={25}
              />
            </span>
          )}
        </div>
      </div>
    );
  }
}
