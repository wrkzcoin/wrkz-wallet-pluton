// @flow
import React, { Component } from 'react';
import { session, eventEmitter, il8n } from '../index';

type Props = {};

type State = {
  nodeFee: number,
  darkMode: boolean
};

export default class NodeFee extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      nodeFee: session.daemon.feeAmount || 0,
      darkMode: session.darkMode
    };
    this.refreshNodeFee = this.refreshNodeFee.bind(this);
    this.darkModeOn = this.darkModeOn.bind(this);
    this.darkModeOff = this.darkModeOff.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
    eventEmitter.on('darkmodeon', this.darkModeOn);
    eventEmitter.on('darkmodeoff', this.darkModeOff);
  }

  componentWillUnmount() {
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
    eventEmitter.off('darkmodeon', this.darkModeOn);
    eventEmitter.off('darkmodeoff', this.darkModeOff);
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

  refreshNodeFee = () => {
    this.setState({
      nodeFee: session.daemon.feeAmount
    });
  };

  render() {
    const { darkMode, nodeFee } = this.state;
    if (nodeFee > 0) {
      return (
        <div className="control statusicons">
          <div className="tags has-addons">
            <span
              className={
                darkMode ? 'tag is-dark is-large' : 'tag is-white is-large'
              }
            >
              {il8n.node_fee}
            </span>
            <span className="tag is-danger is-large">
              {session.atomicToHuman(nodeFee, true)}{' '}
              {session.wallet.config.ticker}
            </span>
          </div>
        </div>
      );
    }
    return null;
  }
}
