// @flow
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Redirect, withRouter } from 'react-router-dom';
import { session, eventEmitter } from '../index';

type State = {
  home: boolean,
  importKey: boolean,
  importSeed: boolean,
  changePassword: boolean,
  firstStartup: boolean,
  loginFailed: boolean
};

type Location = {
  hash: string,
  pathname: string,
  search: string
};

type Props = {
  location: Location
};

class Redirector extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      home: false,
      importKey: false,
      importSeed: false,
      changePassword: false,
      firstStartup: session.firstStartup,
      loginFailed: session.loginFailed
    };
    this.goToImportFromSeed = this.goToImportFromSeed.bind(this);
    this.goToImportFromKey = this.goToImportFromKey.bind(this);
    this.goToPasswordChange = this.goToPasswordChange.bind(this);
    this.goToHome = this.goToHome.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('importSeed', this.goToImportFromSeed);
    ipcRenderer.on('importKey', this.goToImportFromKey);
    ipcRenderer.on('handlePasswordChange', this.goToPasswordChange);
    eventEmitter.on('openNewWallet', this.goToHome);
    eventEmitter.on('initializeNewSession', this.goToHome);
    eventEmitter.on('refreshLogin', this.goToHome);
  }

  componentWillUnmount() {
    ipcRenderer.off('importSeed', this.goToImportFromSeed);
    ipcRenderer.off('importKey', this.goToImportFromKey);
    ipcRenderer.off('handlePasswordChange', this.goToPasswordChange);
    eventEmitter.off('openNewWallet', this.goToHome);
    eventEmitter.off('initializeNewSession', this.goToHome);
    eventEmitter.off('refreshLogin', this.goToHome);
  }

  goToHome = () => {
    this.setState({
      home: true
    });
  };

  goToImportFromSeed = () => {
    this.setState({
      importSeed: true
    });
  };

  goToImportFromKey = () => {
    this.setState({
      importKey: true
    });
  };

  goToPasswordChange = () => {
    this.setState({
      changePassword: true
    });
  };

  goToFirstStartup = () => {
    this.setState({
      firstStartup: true
    });
  };

  render() {
    // prettier-ignore
    const { location: { pathname } } = this.props;
    const {
      changePassword,
      importKey,
      importSeed,
      loginFailed,
      firstStartup,
      home
    } = this.state;
    if (home === true && pathname !== '/') {
      return <Redirect to="/" />;
    }
    if (changePassword === true && pathname !== '/changepassword') {
      return <Redirect to="/changepassword" />;
    }

    if (importKey === true && pathname !== '/importkey') {
      return <Redirect to="/importkey" />;
    }

    if (importSeed === true && pathname !== '/import') {
      return <Redirect to="/import" />;
    }

    if (
      loginFailed === true &&
      pathname !== '/login' &&
      pathname !== '/import' &&
      pathname !== '/importkey'
    ) {
      return <Redirect to="/login" />;
    }

    if (firstStartup === true && pathname !== '/firststartup') {
      return <Redirect to="/firststartup" />;
    }

    return null;
  }
}

// $FlowFixMe
export default withRouter(Redirector);
