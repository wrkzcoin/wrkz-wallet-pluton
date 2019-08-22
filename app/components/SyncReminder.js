// @flow
import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';

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
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
  }

  componentWillUnmount() {
    clearInterval(this.syncInterval);
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeoff', this.darkModeOff);
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
            <i className="fas fa-sync fa-spin" /> &nbsp;Your wallet is still
            syncing...
          </p>
        )}
      </div>
    );
  }
}
