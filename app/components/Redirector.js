import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Redirect, withRouter } from 'react-router-dom';

class Redirector extends Component<props> {
  props: Props;

  constructor(props?: Props) {
    super(props);
    this.state = {
      importkey: false,
      importseed: false,
      changePassword: false
    };
    this.handleImportFromSeed = this.handleImportFromSeed.bind(this);
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
    if (
      this.state.changePassword === true &&
      this.props.location.pathname !== '/changepassword'
    ) {
      return <Redirect to="/changepassword" />;
    }

    if (
      this.state.importkey === true &&
      this.props.location.pathname !== '/importkey'
    ) {
      return <Redirect to="/importkey" />;
    }

    if (
      this.state.importseed === true &&
      this.props.location.pathname !== '/import'
    ) {
      return <Redirect to="/import" />;
    }

    return null;
  }
}

export default withRouter(Redirector);
