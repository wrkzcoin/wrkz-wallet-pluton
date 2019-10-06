// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import jdenticon from 'jdenticon';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import uiType from '../utils/uitype';
import { session } from '../index';

const addressBook = [
  {
    name: 'ExtraHash',
    address:
      'TRTLv1ExtraTJ2oebAvuQB4TzF2uJEFpnbJCkQ4xr71vcqoS96fHX3kTKfHQwkK2Ee3TUD1NCsprfiZHnDL5mqrGiEJHgNz33Xf',
    paymentID:
      '3ebf0be306a997b50f17d3bfbfd85d4bd5cb6bc38da1eef6d0646a148ff42c8a'
  },
  {
    name: 'Xaz-kun',
    address:
      'TRTLv2cJg6ECNdvqomtzWFB79S5hR5xFc8F3friQZscocBTuPqhCzKyDZPt61JG5eVGJKrHsXJHSUHDmAhZ134q8QRN2kHnyyHz',
    paymentID: ''
  },
  {
    name: 'zpalmtree',
    address:
      'TRTLv2Fyavy8CXG8BPEbNeCHFZ1fuDCYCZ3vW5H5LXN4K2M2MHUpTENip9bbavpHvvPwb4NDkBWrNgURAd5DB38FHXWZyoBh4wW',
    paymentID: ''
  }
];

type State = {
  darkMode: boolean,
  showNewContactForm: boolean,
  newName: string,
  newAddress: string,
  newPaymentID: string
};

type Props = {};

export default class AddressBook extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode,
      showNewContactForm: false,
      newName: '',
      newAddress: '',
      newPaymentID: ''
    };
    this.showAddContactForm = this.showAddContactForm.bind(this);
    this.handleNewAddressChange = this.handleNewAddressChange.bind(this);
    this.handleNewNameChange = this.handleNewNameChange.bind(this);
    this.handleNewPaymentIDChange = this.handleNewPaymentIDChange.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  showAddContactForm = () => {
    this.setState({
      showNewContactForm: true
    });
  };

  handleNewNameChange = (event: any) => {
    const newName = event.target.value;
    this.setState({
      newName
    });
  };

  handleNewAddressChange = (event: any) => {
    const newAddress = event.target.value;
    const regex = /^[a-z0-9]*$/i;
    if (!regex.test(newAddress)) {
      return;
    }
    this.setState({
      newAddress
    });
  };

  handleNewPaymentIDChange = (event: any) => {
    const newPaymentID = event.target.value;
    this.setState({
      newPaymentID
    });
  };

  render() {
    const {
      darkMode,
      showNewContactForm,
      newName,
      newAddress,
      newPaymentID
    } = this.state;
    const { backgroundColor, tableMode, textColor } = uiType(darkMode);
    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <NavBar darkMode={darkMode} />
          <div className={`maincontent-homescreen ${backgroundColor}`}>
            <table
              className={`table is-striped is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
            >
              <thead>
                <tr>
                  <th className={textColor}>Icon</th>
                  <th className={textColor}>Name</th>
                  <th className={textColor}>Address</th>
                  <th className={textColor}>Payment ID</th>
                  <th className="has-text-centered">
                    <a
                      className={textColor}
                      onClick={this.showAddContactForm}
                      onKeyPress={this.showAddContactForm}
                      role="button"
                      tabIndex={0}
                      onMouseDown={event => event.preventDefault()}
                    >
                      <i className="fas fa-user-plus" />
                    </a>
                  </th>
                </tr>
              </thead>
              <tbody>
                {showNewContactForm && (
                  <tr>
                    <td>
                      <span
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                          __html: jdenticon.toSvg(newAddress, 114)
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="input no-resize"
                        value={newName}
                        onChange={this.handleNewNameChange}
                      />
                    </td>
                    <td>
                      <input
                        className="input no-resize"
                        value={newAddress}
                        onChange={this.handleNewAddressChange}
                      />
                    </td>
                    <td>
                      <input
                        className="input no-resize"
                        value={newPaymentID}
                        onChange={this.handleNewPaymentIDChange}
                      />
                    </td>
                    <td>
                      <i
                        className="fas fa-save is-size-2 has-text-centered"
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                )}
                {addressBook.map(contact => {
                  const { name, address, paymentID } = contact;
                  return (
                    <tr>
                      <td>
                        <span
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{
                            __html: jdenticon.toSvg(address, 114)
                          }}
                        />
                      </td>
                      <td>
                        <p className={`subtitle ${textColor}`}>{name}</p>
                      </td>
                      <td>
                        <textarea
                          className={`textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                          readOnly
                        >
                          {address}
                        </textarea>
                      </td>
                      <td>
                        <textarea
                          className={`textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                          readOnly
                        >
                          {paymentID}
                        </textarea>
                      </td>
                      <td>
                        <br />
                        <i
                          className="fa fa-paper-plane is-size-2 has-text-centered"
                          aria-hidden="true"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
