// Copyright (C) 2019 ExtraHash
// Copyright (C) 2019, WrkzCoin
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { session, eventEmitter, il8n } from '../index';
import Configure from '../Configure';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  nodeFee: number,
  connectednode: string
};

export default class NodeFee extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      nodeFee: session.daemon.feeAmount || 0,
	  connectednode: session.daemon.host + ':' + session.daemon.port
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
      nodeFee: session.daemon.feeAmount,
      connectednode: session.daemon.host + ':' + session.daemon.port,
    });
  };

  render() {
    const { darkMode, size } = this.props;
    const { nodeFee, connectednode } = this.state;
    const color = darkMode ? 'is-dark' : 'is-white';

    if (nodeFee > 0) {
      return (
        <div className="control statusicons">
          <div className="tags has-addons">
            <span className={`tag is-success ${size}`}>{connectednode}</span>
            <span className={`tag ${color} ${size}`}>{il8n.node_fee}</span>
            <span className={`tag is-danger ${size}`}>
              {session.atomicToHuman(nodeFee, true)} {Configure.ticker}
            </span>
          </div>
        </div>
      );
    }
    return null;
  }
}
