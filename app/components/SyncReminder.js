// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { session } from '../index';
import uiType from '../utils/uitype';

type Props = {
  darkMode: boolean
};

type State = {
  syncStatus: number
};

export default class SyncReminder extends Component<Props, State> {
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
  }

  render() {
    const { syncStatus } = this.state;
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);

    return (
      <div className="syncreminder">
        {syncStatus < 100 && session.daemon.networkBlockCount !== 0 && (
          <p className={`${textColor} glow`}>
            <i className="fas fa-sync fa-spin" /> &nbsp;Don&apos;t panic! Your
            wallet is still syncing...
          </p>
        )}
        {syncStatus === 100 && session.daemon.networkBlockCount !== 0 && (
          <p className={`${textColor} glow-green`}>
            <i className="fas fa-check-circle" /> &nbsp;Your wallet is fully
            synced.
          </p>
        )}
        {session.daemon.networkBlockCount === 0 && (
          <p className={`${textColor} glow-red`}>
            <i className="fas fa-times" /> &nbsp;The connected node appears to
            be offline.
          </p>
        )}
      </div>
    );
  }
}
