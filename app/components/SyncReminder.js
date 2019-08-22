// @flow
import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import { session } from '../index';

type Props = {};

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
    ReactTooltip.rebuild();
  }

  render() {
    const { syncStatus } = this.state;

    return (
      <div className="syncreminder">
        {syncStatus < 100 && session.daemon.networkBlockCount !== 0 && (
          <p className="has-text-warning glow">
            {' '}
            <i className="fas fa-sync fa-spin" /> &nbsp;Don&apos;t panic! Your
            wallet is still syncing...
          </p>
        )}
        {syncStatus === 100 && session.daemon.networkBlockCount !== 0 && (
          <p className="has-text-success glow-green">
            {' '}
            <i className="fas fa-check-circle" /> &nbsp;Your wallet is fully
            synced.
          </p>
        )}
        {session.daemon.networkBlockCount === 0 && (
          <p className="has-text-danger glow-red">
            {' '}
            <i className="fas fa-times" /> &nbsp;The connected node appears to
            be offline.
          </p>
        )}
      </div>
    );
  }
}
