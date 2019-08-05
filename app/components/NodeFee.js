// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';

type Props = {};

type State = {
  nodeFee: number,
  darkmode: boolean
};

export default class NodeFee extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      nodeFee: session.daemon.feeAmount || 0,
      darkmode: session.darkMode
    };
    this.refreshNodeFee = this.refreshNodeFee.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('gotNodeFee', this.refreshNodeFee);
  }

  componentWillUnmount() {
    eventEmitter.off('gotNodeFee', this.refreshNodeFee);
  }

  refreshNodeFee = () => {
    this.setState({
      nodeFee: session.daemon.feeAmount
    });
  };

  render() {
    const { darkmode, nodeFee } = this.state;
    if (nodeFee > 0) {
      return (
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
      );
    }
    return null;
  }
}
