// @flow
import React, { Component } from 'react';
import { session, eventEmitter } from '../index';
import SyncStatus from './SyncStatus';
import Balance from './Balance';

type Props = {};

type State = {
  darkmode: boolean,
  nodeFee: number
};

export default class BottomBar extends Component<Props, State> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkmode: session.darkMode,
      nodeFee: session.daemon.feeAmount || 0
    };
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
    this.refreshNodeFee = this.refreshNodeFee.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
  }

  componentWillUnmount() {
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
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

  refreshNodeFee = () => {
    this.setState({
      nodeFee: session.daemon.feeAmount
    });
  };

  render() {
    const { darkmode, nodeFee } = this.state;
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
          {nodeFee > 0 && (
            <div className="control statusicons">
              <div className="tags has-addons">
                <span
                  className={
                    darkmode ? 'tag is-dark is-large' : 'tag is-white is-large'
                  }
                >
                  Node Fee:
                </span>
                <span className="tag is-danger is-large">
                  {session.atomicToHuman(nodeFee, true)}{' '}
                  {session.wallet.config.ticker}
                </span>
              </div>
            </div>
          )}
          <SyncStatus />
          <Balance />
        </div>
      </div>
    );
  }
}
