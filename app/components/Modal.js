// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import uiType from '../utils/uitype';
import { eventEmitter } from '../index';

type State = {
  isActive: string,
  message: any,
  confirmLabel: string,
  denyLabel: string,
  confirmAction: string
};

type Props = {
  darkMode: boolean
};

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
    this.closeModal();
    const { confirmAction } = this.state;
    eventEmitter.emit(confirmAction);
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
    const { darkMode } = this.props;
    const { isActive, message, confirmLabel, denyLabel } = this.state;
    const { backgroundColor } = uiType(darkMode);

    return (
      <div className={`modal ${isActive} fadein`}>
        <div
          className="modal-background"
          onClick={this.closeModal}
          onKeyPress={this.closeModal}
          role="button"
          tabIndex={0}
          onMouseDown={event => event.preventDefault()}
        />
        <div className="modal-content">
          <div className={`box ${backgroundColor}`}>
            {message}
            <br />
            <div className="buttons is-right">
              <div
                className="button is-success is-large"
                onClick={() => this.confirmModal()}
                onKeyPress={() => this.confirmModal()}
                role="button"
                tabIndex={0}
                onMouseDown={event => event.preventDefault()}
              >
                {confirmLabel}
              </div>
              {denyLabel && (
                <div
                  className="button is-danger is-large"
                  onClick={this.closeModal}
                  onKeyPress={this.closeModal}
                  role="button"
                  tabIndex={0}
                  onMouseDown={event => event.preventDefault()}
                >
                  {denyLabel}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
