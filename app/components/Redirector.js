// @flow
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Redirect, withRouter } from 'react-router-dom';
import { eventEmitter } from '../index';
import log from 'electron-log';

type State = {
  importKey?: boolean,
  importSeed?: boolean,
  changePassword?: boolean,
  login?: boolean,
  firstStartup?: boolean
};

type Location = {
  hash: string,
  pathname: string,
  search: string
}

type Props = {
  location: Location
};

class Redirector extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      importKey: false,
      importSeed: false,
      changePassword: false,
      login: false,
      firstStartup: false
    };
    this.goToImportFromSeed = this.goToImportFromSeed.bind(this);
    this.goToImportFromKey = this.goToImportFromKey.bind(this);
    this.goToPasswordChange = this.goToPasswordChange.bind(this);

  }

  componentDidMount() {
    ipcRenderer.on('importSeed', this.goToImportFromSeed);
    ipcRenderer.on('importKey', this.goToImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.goToPasswordChange);
    eventEmitter.on('loginFailed', this.goToLogin);
  }

  componentWillUnmount() {
    ipcRenderer.off('importSeed', this.goToImportFromSeed);
    ipcRenderer.off('importKey', this.goToImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.goToPasswordChange);
    eventEmitter.off('loginFailed', this.goToLogin);
  }

  goToImportFromSeed = () => {
    this.setState({
      importSeed: true
    });
  }

  goToImportFromKey = () => {
    this.setState({
      importKey: true
    });
  }

  goToPasswordChange = () => {
    this.setState({
      changePassword: true
    });
  }

  goToLogin = () => {
    this.setState({
      login: true
    });
  }

  goToFirstStartup = () => {
    this.setState({
      firstStartup: true
    });
  }

  render() {
    // eslint-disable-next-line prettier/prettier
    const { location: { pathname } } = this.props;
    const {
      changePassword,
      importKey,
      importSeed,
      login,
      firstStartup
    } = this.state;
    if (changePassword === true && pathname !== '/changepassword') {
      return <Redirect to="/changepassword" />;
    }

    if (importKey === true && pathname !== '/importkey') {
      return <Redirect to="/importkey" />;
    }

    if (importSeed === true && pathname !== '/import') {
      return <Redirect to="/import" />;
    }

    if (login === true && pathname !== '/login') {
      return <Redirect to="/login" />;
    }

    if (firstStartup === true && pathname !== '/firststartup') {
      return <Redirect to="/firststartup" />;
    }

    return null;
  }
}

export default withRouter(Redirector);
