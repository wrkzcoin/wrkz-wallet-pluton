// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import { eventEmitter } from '../index';

type State = {
  isActive: string
};

type Props = {};

export default class Modal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isActive: '',
      message: ''
    };
    this.closeModal = this.closeModal.bind(this);
    this.openModal = this.openModal.bind(this);
  }

  componentWillMount() {
    eventEmitter.on('openModal', message => this.openModal(message));
  }

  componentWillUnmount() {}

  closeModal = () => {
    this.setState({
      isActive: ''
    });
  };

  openModal = (message: string) => {
    this.setState({
      isActive: 'is-active',
      message
    });
  };

  render() {
    const { isActive, message } = this.state;

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
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  }
}
