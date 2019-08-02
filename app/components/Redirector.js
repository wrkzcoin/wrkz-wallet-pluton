import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { matchPath } from 'react-router';
import { Redirect } from 'react-router-dom';
import { session, eventEmitter, loginCounter } from '../index';
import log from 'electron-log';

export default class Redirector extends Component<props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      firstStartup: session.firstStartup,
      importkey: false,
      importseed: false,
      changePassword: false,
      loginFailed: false,
      loginInProgress: false,
      goHome: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this)
    this.handleImportFromKey = this.handleImportFromKey.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('importSeed', this.handleImportFromSeed);
    ipcRenderer.on('importKey', this.handleImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.handlePasswordChange);
  }

  componentWillUnmount() {
    ipcRenderer.off('importSeed', this.handleImportFromSeed);
    ipcRenderer.off('importKey', this.handleImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.handlePasswordChange);
  }

  handleImportFromSeed(evt, route) {
    this.setState({
      importseed: true
    });
  }

  handleImportFromKey(evt, route) {
    this.setState({
      importkey: true
    });
  }

  handlePasswordChange() {
    this.setState({
      changePassword: true
    });
  }

  render() {

    if (this.state.goHome === true) {
      return <Redirect to="/" />
    }

    if (this.state.changePassword === true) {
      return <Redirect to="/changepassword" />;
    }

    if (this.state.firstStartup === true) {
      return <Redirect to="/firststartup" />;
    }

    if (this.state.importkey === true) {
      return <Redirect to="/importkey" />;
    }

    if (this.state.importseed === true) {
      return <Redirect to="/import" />;
    }

    return null;

  }
}
