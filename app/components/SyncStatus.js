// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';

type Props = {
  size: string,
  color: string
};

type State = {
  syncStatus: number,
  darkMode: boolean
};

export default class SyncStatus extends Component<Props, State> {
  props: Props;

  state: State;

  syncInterval: IntervalID;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      darkMode: session.darkMode
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

  darkModeOn = () => {
    this.setState({
      darkMode: true
    });
  };

  darkModeOff = () => {
    this.setState({
      darkMode: false
    });
  };

  render() {
    const { darkMode, syncStatus } = this.state;
    const { size, color } = this.props;

    let tagColor = '';
    if (color === 'fill') {
      tagColor = darkMode ? 'is-black' : 'is-white';
    }
    if (color === 'background') {
      tagColor = darkMode ? 'is-dark' : 'is-light';
    }

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
              darkMode ? `tag ${tagColor} ${size}` : `tag ${tagColor} ${size}`
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
