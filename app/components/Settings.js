/* eslint-disable react/button-has-type */
/* eslint-disable class-methods-use-this */
// @flow
import request from 'request';
import { remote, ipcRenderer } from 'electron';
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import { Redirect, Link } from 'react-router-dom';
import log from 'electron-log';
import { session } from '../reducers/index';
import navBar from './NavBar';
import routes from '../constants/routes';

function getNodeList() {
  const options = {
    method: 'GET',
    url:
      'https://raw.githubusercontent.com/turtlecoin/turtlecoin-nodes-json/master/turtlecoin-nodes.json'
  };
  // eslint-disable-next-line func-names
  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    log.debug(body);
    return body;
  });
}

type Props = {
  syncStatus: number,
  unlockedBalance: number,
  lockedBalance: number,
  transactions: Array<string>,
  handleSubmit: () => void,
  transactionInProgress: boolean,
  importseed: boolean,
  importkey: boolean,
  nodeList: Array<string>
};

export default class Settings extends Component<Props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions(),
      transactionInProgress: false,
      importkey: false,
      importseed: false,
      nodeList: getNodeList()
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refresh(), 1000);
    ipcRenderer.on('importSeed', (evt, route) =>
      this.handleImportFromSeed(evt, route)
    );
    ipcRenderer.on('importKey', (evt, route) =>
      this.handleImportFromKey(evt, route)
    );
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
  }

  async handleSubmit(event) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    const [coinbaseScan, autoOptimize] = [
      event.target[0].value, // whether or not to scan coinbase transactions
      event.target[1].value // whether or not to keep wallet auto-optimized
    ];

    log.debug(
      `coinbaseScan = ${coinbaseScan}`,
      `\nautoOptimize = ${autoOptimize}`
    );
  }

  handleImportFromSeed(evt, route) {
    clearInterval(this.interval);
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    clearInterval(this.interval);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    this.setState({
      importkey: true
    });
  }

  refresh() {
    this.setState(prevState => ({
      syncStatus: session.getSyncStatus(),
      unlockedBalance: session.getUnlockedBalance(),
      lockedBalance: session.getLockedBalance(),
      transactions: session.getTransactions()
    }));
  }

  render() {
    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }

    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }

    return (
      <div>
        {navBar('settings')}
        <div className="box has-background-light maincontent">
          <form onSubmit={this.handleSubmit}>
            <div className="columns">
              <div className="column">
              <h2 className="title">Configuration</h2>
                <div className="field">
                  <input
                    id="coinbasescan"
                    type="checkbox"
                    className="switch is-success is-rounded"
                  />
                  <label htmlFor="coinbasescan">
                    Scan for solo mined blocks
                  </label>
                </div>
                <div className="field">
                  <input
                    id="auto_opt"
                    type="checkbox"
                    className="switch is-success is-rounded"
                  />
                  <label htmlFor="auto_opt">
                    Keep wallet optimized automatically
                  </label>
                </div>
                <div className="field">
                  <input
                    id="minimize_to_tray"
                    type="checkbox"
                    className="switch is-success is-rounded"
                  />
                  <label htmlFor="minimize_to_tray">
                    Minimize to system tray
                  </label>
                </div>
                <div className="buttons">
                  <button type="submit" className="button is-success is-large">
                    Save
                  </button>
                  <button type="reset" className="button is-large">
                    Discard
                  </button>
                </div>
              </div>
              <div className="column">
                <h2 className="title">Node Settings</h2>
                <label className="label">
                  Change Node
                  <div className="field has-addons">
                    <div className="control is-expanded">
                      <input
                        className="input"
                        type="text"
                        placeholder="Find a repository"
                      />
                    </div>
                    <div className="control">
                      <a className="button is-warning">Connect to node...</a>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>
        <div className="box has-background-grey-lighter footerbar">
          <div className="field is-grouped is-grouped-multiline is-grouped-right">
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Sync:</span>
                {this.state.syncStatus < 100 && (
                  <span className="tag is-warning is-large">
                    {this.state.syncStatus}%
                    <ReactLoading
                      type="bubbles"
                      color="#363636"
                      height={30}
                      width={30}
                    />
                  </span>
                )}
                {this.state.syncStatus === 100 && (
                  <span className="tag is-success is-large">
                    {this.state.syncStatus}%
                  </span>
                )}
              </div>
            </div>
            <div className="control">
              <div className="tags has-addons">
                <span className="tag is-white is-large">Balance:</span>
                <span className="tag is-info is-large">
                  {session.atomicToHuman(this.state.unlockedBalance, true)} TRTL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
