// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import Select from 'react-select';
import { config, session, eventEmitter } from '../index';
import uiType from '../utils/uitype';

const logLevels = [
  {
    value: 'DISABLED',
    label: 'DISABLED'
  },
  {
    value: 'DEBUG',
    label: 'DEBUG'
  },
  {
    value: 'ERROR',
    label: 'ERROR'
  },
  {
    value: 'INFO',
    label: 'INFO'
  },
  {
    value: 'TRACE',
    label: 'TRACE'
  },
  {
    value: 'WARNING',
    label: 'WARNING'
  }
];

type Props = {
  darkMode: boolean
};

type State = {
  selectedLogLevel: any
};

export default class LogLevelSelector extends Component<Props, State> {
  props: Props;

  state: State;

  options: any[];

  constructor(props?: Props) {
    super(props);
    this.options = logLevels;
    this.state = {
      selectedLogLevel: this.search(config.logLevel, logLevels, 'value')
    };
    this.handleLogLevelChange = this.handleLogLevelChange.bind(this);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleChange = (selectedLogLevel: any) => {
    this.setState({ selectedLogLevel });
  };

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    for (let i = 0; i < arrayToSearch.length; i++) {
      if (arrayToSearch[i][objectPropertyName] === searchedValue) {
        return arrayToSearch[i];
      }
    }
  }

  handleLogLevelChange = (event: any) => {
    const logLevel = this.search(event.value, logLevels, 'value');
    this.setState({
      selectedLogLevel: this.search(logLevel, logLevels, 'value')
    });
    session.modifyConfig('logLevel', event.value);
    session.wallet.setLogLevel(session.evaluateLogLevel(event.value));
    eventEmitter.emit('logLevelChanged');
  };

  render() {
    const { darkMode } = this.props;
    const { selectedLogLevel } = this.state;
    const { textColor } = uiType(darkMode);

    return (
      <div>
        <p className={`has-text-weight-bold ${textColor}`}>
          WalletBackend Log Level:
        </p>
        <Select
          value={selectedLogLevel}
          onChange={this.handleLogLevelChange}
          options={this.options}
        />
      </div>
    );
  }
}
