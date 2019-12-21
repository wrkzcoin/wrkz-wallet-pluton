// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import { il8n, session, eventEmitter } from '../index';
import uiType from '../utils/uitype';

type Props = {
  darkMode: boolean
};

type State = {
  scanHeight: string,
  rescanInProgress: boolean
};

export default class Rescanner extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      scanHeight: '',
      rescanInProgress: false
    };
    this.setRescanInProgress = this.setRescanInProgress.bind(this);
    this.confirmRescan = this.confirmRescan.bind(this);
    this.rescanWallet = this.rescanWallet.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('rescanWallet', this.rescanWallet);
  }

  componentWillUnmount() {
    eventEmitter.off('rescanWallet', this.rescanWallet);
  }

  handleScanHeightChange = (event: any) => {
    this.setState({ scanHeight: event.target.value.trim() });
  };

  setRescanInProgress = (rescanInProgress: boolean) => {
    this.setState({
      rescanInProgress
    });
  };

  rescanWallet = async () => {
    this.setRescanInProgress(true);
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { scanHeight } = this.state;
    log.debug(`Resetting wallet from block ${scanHeight}`);
    this.setState({
      scanHeight: ''
    });
    await session.wallet.reset(Number(scanHeight));
    const message = (
      <div>
        <center>
          <p className={`title ${textColor}`}>Success!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          {`Your wallet is now syncing again from block ${scanHeight}. Patience is a virtue!`}
        </p>
        <p className={`subtitle ${textColor}`} />
      </div>
    );
    eventEmitter.emit('openModal', message, 'OK', null, null);
    this.setRescanInProgress(false);
    this.setState({
      scanHeight: ''
    });
  };

  confirmRescan = async (event: any) => {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    event.preventDefault();
    let scanHeight = event.target[0].value;
    if (scanHeight === '') {
      return;
    }
    scanHeight = parseInt(event.target[0].value, 10);

    if (Number.isNaN(scanHeight)) {
      log.debug('User provided invalid height.');
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            You haven&apos;t entered a valid block height. The input must be a
            positive integer. Please try again.
          </p>
          <p className={`subtitle ${textColor}`} />
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, null);
      this.setState({
        scanHeight: ''
      });
      return;
    }
    const message = (
      <div>
        <center>
          <p className="title has-text-danger">Rescan Warning!</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          {`You are about to rescan your wallet from block ${scanHeight}. Are you sure you want to do this? It could take a very long time.`}
        </p>
      </div>
    );
    eventEmitter.emit('openModal', message, 'OK', 'Nevermind', 'rescanWallet');
  };

  render() {
    const { darkMode } = this.props;
    const { textColor } = uiType(darkMode);
    const { scanHeight, rescanInProgress } = this.state;

    return (
      <form onSubmit={this.confirmRescan}>
        <p className={`has-text-weight-bold ${textColor}`}>
          {il8n.rescan_wallet}
        </p>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              placeholder="Enter a height to scan from..."
              value={scanHeight}
              onChange={this.handleScanHeightChange}
            />
          </div>
          <div className="control">
            <button
              className={`button is-danger ${
                rescanInProgress ? 'is-loading' : ''
              }`}
            >
              <span className="icon is-small">
                <i className="fa fa-undo" />
              </span>
              &nbsp;&nbsp;{il8n.rescan}
            </button>
          </div>
        </div>
      </form>
    );
  }
}
