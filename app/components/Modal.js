// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import log from 'electron-log';
import { eventEmitter } from '../index';

type State = {
  isActive: string,
  message: any,
  confirmLabel: string,
  denyLabel: string,
  confirmAction: string
};

type Props = {};

export default class Modal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isActive: '',
      message: '',
      confirmLabel: '',
      denyLabel: '',
      confirmAction: ''
    };
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.confirmModal = this.confirmModal.bind(this);
  }

  componentWillMount() {
    eventEmitter.on(
      'openModal',
      (message, confirmLabel, denyLabel, confirmAction) =>
        this.openModal(message, confirmLabel, denyLabel, confirmAction)
    );
  }

  componentWillUnmount() {
    eventEmitter.off(
      'openModal',
      (message, confirmLabel, denyLabel, confirmAction) =>
        this.openModal(message, confirmLabel, denyLabel, confirmAction)
    );
  }

  closeModal = () => {
    this.setState({
      isActive: ''
    });
  };

  confirmModal = () => {
    const { confirmAction } = this.state;
    log.debug(confirmAction);
    log.debug('confirmed!');
    this.closeModal();
  };

  openModal = (
    message: string,
    confirmLabel: string,
    denyLabel: string,
    confirmAction: string
  ) => {
    this.setState({
      isActive: 'is-active',
      message,
      confirmLabel,
      denyLabel,
      confirmAction
    });
  };

  render() {
    const { isActive, message, confirmLabel, denyLabel } = this.state;

    return (
      <div className={`modal ${isActive}`}>
        <div
          className="modal-background"
          onClick={this.closeModal}
          onKeyPress={this.closeModal}
          role="button"
          tabIndex={0}
          onMouseDown={event => event.preventDefault()}
        />
        <div className="modal-content">
          <div className="box">
            {message}
            <br />
            <div className="buttons is-right">
              <div
                className="button is-success"
                onClick={() => this.confirmModal()}
                onKeyPress={() => this.confirmModal()}
                role="button"
                tabIndex={0}
                onMouseDown={event => event.preventDefault()}
              >
                {confirmLabel}
              </div>
              <div
                className="button is-danger"
                onClick={this.closeModal}
                onKeyPress={this.closeModal}
                role="button"
                tabIndex={0}
                onMouseDown={event => event.preventDefault()}
              >
                {denyLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
