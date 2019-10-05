// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';
import { session } from '../index';

type State = {
  darkMode: boolean
};

type Props = {};

export default class AddressBook extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
  }

  componentWillMount() {}

  componentWillUnmount() {}

  render() {
    const { darkMode } = this.state;
    const { backgroundColor } = uiType(darkMode);
    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <NavBar darkMode={darkMode} />
          <div className={`maincontent-homescreen ${backgroundColor}`} />
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
