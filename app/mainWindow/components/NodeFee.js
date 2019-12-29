// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { session, eventEmitter, il8n } from '../index';
import { atomicToHuman } from '../utils/utils';

type Props = {
  size: string,
  darkMode: boolean
};

type State = {
  nodeFee: number
};

export default class NodeFee extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      nodeFee: session.getNodeFee()
    };
    this.handleNewNodeFee = this.handleNewNodeFee.bind(this);
  }

  componentDidMount() {
    eventEmitter.on('gotNodeFee', this.handleNewNodeFee);
  }

  componentWillUnmount() {
    eventEmitter.off('gotNodeFee', this.handleNewNodeFee);
  }

  handleNewNodeFee = () => {
    this.setState({
      nodeFee: session.getNodeFee()
    });
  };

  render() {
    const { darkMode, size } = this.props;
    const { nodeFee } = this.state;
    const color = darkMode ? 'is-dark' : 'is-white';

    if (nodeFee > 0) {
      return (
        <div className="control statusicons">
          <div className="tags has-addons">
            <span className={`tag ${color} ${size}`}>{il8n.node_fee}</span>
            <span className={`tag is-danger ${size}`}>
              {atomicToHuman(nodeFee, true)} {il8n.TRTL}
            </span>
          </div>
        </div>
      );
    }
    return null;
  }
}
