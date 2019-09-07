// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { remote } from 'electron';
import { il8n, session } from '../index';
import uiType from '../utils/uitype';

type Props = {};

type State = {
  rewindHeight: string,
  rewindInProgress: boolean
};

export default class Rewinder extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      rewindHeight: '',
      rewindInProgress: false
    };
    this.rewindWallet = this.rewindWallet.bind(this);
    this.handleRewindHeightChange = this.handleRewindHeightChange.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  handleRewindHeightChange = (event: any) => {
    const rewindHeight = event.target.value.trim();
    this.setState({ rewindHeight });
  };

  rewindWallet = async (event: any) => {
    event.preventDefault();
    this.setState({
      rewindInProgress: true
    });
    const rewindHeight = parseInt(event.target[0].value, 10);
    if (Number.isNaN(rewindHeight)) {
      this.setState({
        rewindInProgress: false
      });
      return;
    }
    await session.wallet.rewind(rewindHeight);
    this.setState({
      rewindInProgress: false,
      rewindHeight: ''
    });
    remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['OK'],
      title: `${il8n.rewind_complete}`,
      message: ` ${il8n.has_been_rewound_beginning}${rewindHeight}${
        il8n.has_been_rewound_end
      }`
    });
  };

  render() {
    const { textColor } = uiType(true);
    const { rewindInProgress, rewindHeight } = this.state;

    return (
      <form onSubmit={this.rewindWallet} data-tip={il8n.rewind_wallet_help}>
        <p className={`has-text-weight-bold ${textColor}`}>
          {il8n.rewind_wallet}
        </p>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              placeholder="Enter a height to scan from..."
              value={rewindHeight}
              onChange={this.handleRewindHeightChange}
            />
          </div>
          <div className="control">
            <button
              className={
                rewindInProgress
                  ? 'button is-warning is-loading'
                  : 'button is-warning'
              }
            >
              {il8n.rewind}
            </button>
          </div>
        </div>
      </form>
    );
  }
}
