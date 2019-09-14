// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';

type State = {
  isActive: string
};

type Props = {};

export default class Modal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isActive: ''
    };
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  toggleModal = () => {
    const { isActive } = this.state;
    this.setState({
      isActive: isActive === 'is-active' ? '' : 'is-active'
    });
  };

  render() {
    const { isActive } = this.state;

    return (
      <div className={`modal ${isActive}`}>
        <div
          className="modal-background"
          onClick={this.toggleModal}
          onKeyPress={this.toggleModal}
          role="button"
          tabIndex={0}
          onMouseDown={event => event.preventDefault()}
        />
        <div className="modal-content">
          <div className="box">
            <p>Yes, this is a modal!</p>
          </div>
        </div>
      </div>
    );
  }
}
