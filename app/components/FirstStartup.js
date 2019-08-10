// @flow
import { remote } from 'electron';
import React, { Component } from 'react';
import log from 'electron-log';
import { config, session, eventEmitter, il8n } from '../index';
import Redirector from './Redirector';
import uiType from '../utils/uitype';

// import styles from './Send.css';

type Props = {};

type State = {
  darkMode: boolean
};

export default class FirstStartup extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleSubmit(event: any) {
    // We're preventing the default refresh of the page that occurs on form submit
    event.preventDefault();
    const oldPassword = event.target[0].value;
    const newPassword = event.target[1].value;
    const passwordConfirm = event.target[2].value;
    if (oldPassword !== session.walletPassword) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: il8n.change_passwd_incorrect_passwd_title,
        message: il8n.change_passwd_incorrect_passwd_message
      });
      return;
    }
    if (newPassword !== passwordConfirm) {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: il8n.change_passwd_passwd_mismatch_title,
        message: il8n.change_passwd_passwd_mismatch_message
      });
      return;
    }
    session.walletPassword = newPassword;
    const saved = session.saveWallet(config.walletFile);
    if (saved) {
      remote.dialog.showMessageBox(null, {
        type: 'info',
        buttons: [il8n.ok],
        title: il8n.change_passwd_passwd_change_success_title,
        message: il8n.change_passwd_passwd_change_success_message
      });
    } else {
      remote.dialog.showMessageBox(null, {
        type: 'error',
        buttons: [il8n.ok],
        title: il8n.change_passwd_passwd_change_unsuccess_title,
        message: il8n.change_passwd_passwd_change_unsuccess_message
      });
    }
  }

  openExisting = () => {
    log.debug('User selected to open an existing wallet.');
    eventEmitter.emit('handleOpen');
  };

  createNew = () => {
    log.debug('User selected to create a new wallet.');
    eventEmitter.emit('handleNew');
  };

  importFromKeysOrSeed() {
    log.debug('User selected to import wallet.');
    // seed will be 0, keys will be 1
    const userSelection = remote.dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['Cancel', 'Seed', 'Keys'],
      title: il8n.restore,
      message: il8n.seed_or_keys
    });
    if (userSelection === 1) {
      log.debug('User selected to import from seed...');
      eventEmitter.emit('importSeed');
    } else if (userSelection === 2) {
      log.debug('User selected to import from keys...');
      eventEmitter.emit('importKey');
    }
  }

  render() {
    const { darkMode } = this.state;
    const { backgroundColor, fillColor, redTitleColor, buttonColor } = uiType(
      darkMode
    );

    return (
      <div>
        <Redirector />
        <div className={`fullwindow outer-div ${backgroundColor}`}>
          <div className="mid-div">
            <div className={`box loginbox passwordchangebox ${fillColor}`}>
              <h1 className={`title has-text-centered ${redTitleColor}`}>
                {il8n.welcome_to_proton}
              </h1>
              <button
                className={`button is-large is-fullwidth ${buttonColor}`}
                onClick={this.openExisting}
              >
                {il8n.open_existing_wallet}
              </button>
              <br />
              <button
                className={`button is-large is-fullwidth ${buttonColor}`}
                onClick={this.createNew}
              >
                {il8n.create_new_wallet}
              </button>
              <br />
              <button
                className={`button is-large is-fullwidth ${buttonColor}`}
                onClick={this.importFromKeysOrSeed}
              >
                {il8n.import_keys_seed}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
