// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import uiType from '../utils/uitype';

type State = {
  isActive: string
};

type Props = {
  darkMode: boolean
};

export default class Modal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isActive: 'is-active'
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
    const { darkMode } = this.props;
    const { isActive } = this.state;
    const { textColor } = uiType(darkMode);

    return (
      <div className={`modal ${isActive}`}>
        <div className="modal-background" />
        <div className="modal-content">
          <center>
            <p className={textColor}>Yes, this is a modal!</p>
          </center>
        </div>
        <button
          className="modal-close is-large"
          aria-label="close"
          onClick={this.toggleModal}
        />
      </div>
    );
  }
}
