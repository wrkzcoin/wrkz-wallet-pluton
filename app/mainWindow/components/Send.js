// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

/* eslint-disable jsx-a11y/label-has-associated-control */

import crypto from 'crypto';
import { ipcRenderer } from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import React, { Component } from 'react';
import Creatable from 'react-select/creatable';
import ReactTooltip from 'react-tooltip';
import {
  session,
  eventEmitter,
  il8n,
  config,
  loginCounter,
  addressList
} from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import { uiType, atomicToHuman } from '../utils/utils';
import donateInfo from '../constants/donateInfo.json';

type Props = {
  uriAddress?: string,
  uriPaymentID?: string
};

type State = {
  unlockedBalance: number,
  enteredAmount: string,
  totalAmount: string,
  paymentID: string,
  darkMode: boolean,
  transactionInProgress: boolean,
  displayCurrency: string,
  fiatPrice: number,
  fiatSymbol: string,
  symbolLocation: string,
  sendToAddress: string,
  pageAnimationIn: string,
  selectedContact: any,
  menuIsOpen: boolean,
  nodeFee: number
};

const customStyles = {
  control: base => ({
    ...base,
    height: 54,
    minHeight: 54,
    fontSize: '1.5rem'
  }),
  placeholder: base => ({
    ...base,
    color: 'hsl(0, 0%, 71%)',
    fontWeight: 'normal'
  }),
  menuList: base => ({
    ...base,
    color: 'hsl(0, 0%, 21%)',
    fontWeight: 'normal'
  }),
  singleValue: base => ({
    ...base,
    fontWeight: 'normal'
  })
};

export default class Send extends Component<Props, State> {
  props: Props;

  state: State;

  autoCompleteContacts: any[];

  static defaultProps: any;

  constructor(props?: Props) {
    super(props);
    this.state = {
      unlockedBalance: session.getUnlockedBalance(),
      enteredAmount: '',
      totalAmount: '',
      sendToAddress: props.uriAddress || '',
      paymentID: props.uriPaymentID || '',
      darkMode: session.darkMode,
      transactionInProgress: false,
      displayCurrency: config.displayCurrency,
      fiatPrice: session.fiatPrice,
      fiatSymbol: config.fiatSymbol,
      symbolLocation: config.symbolLocation,
      pageAnimationIn: loginCounter.getAnimation('/send'),
      selectedContact: null,
      menuIsOpen: false,
      nodeFee: session.getNodeFee()
    };

    this.generatePaymentID = this.generatePaymentID.bind(this);
    this.resetPaymentID = this.resetPaymentID.bind(this);
    this.handleTransactionInProgress = this.handleTransactionInProgress.bind(
      this
    );
    this.handleTransactionCancel = this.handleTransactionCancel.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleTotalAmountChange = this.handleTotalAmountChange.bind(this);
    this.sendAll = this.sendAll.bind(this);
    this.handlePaymentIDChange = this.handlePaymentIDChange.bind(this);
    this.updateFiatPrice = this.updateFiatPrice.bind(this);
    this.handleSendToAddressChange = this.handleSendToAddressChange.bind(this);
    this.confirmTransaction = this.confirmTransaction.bind(this);
    this.checkInputLength = this.checkInputLength.bind(this);
    this.handleDonate = this.handleDonate.bind(this);
    this.handleNewNodeFee = this.handleNewNodeFee.bind(this);
    this.autoCompleteContacts = [
      ...addressList.map(contact => {
        return { label: contact.name, value: contact.address };
      })
    ];
    this.handleSendTransactionResponse = this.handleSendTransactionResponse.bind(
      this
    );
    this.devContact = {
      label: donateInfo.name,
      value: donateInfo.address
    };
  }

  componentDidMount() {
    eventEmitter.on('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.on('transactionCancel', this.handleTransactionCancel);
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('gotNodeFee', this.handleNewNodeFee);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
    eventEmitter.on('confirmTransaction', this.sendTransaction);
    ipcRenderer.on('handleDonate', this.handleDonate);
    ipcRenderer.on('fromBackend', this.handleSendTransactionResponse);
    // eslint-disable-next-line react/destructuring-assignment
    if (this.props && this.props.uriAddress) {
      const { uriAddress } = this.props;

      const selectedContact = this.search(
        uriAddress,
        [this.devContact, ...this.autoCompleteContacts],
        'value'
      );

      this.setState({
        selectedContact
      });
    }
  }

  componentWillUnmount() {
    eventEmitter.off('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.off('transactionCancel', this.handleTransactionCancel);
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('gotNodeFee', this.handleNewNodeFee);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
    eventEmitter.off('confirmTransaction', this.sendTransaction);
    ipcRenderer.off('handleDonate', this.handleDonate);
    ipcRenderer.off('fromBackend', this.handleSendTransactionResponse);
  }

  modifyCurrency = (displayCurrency: string) => {
    this.setState({
      displayCurrency
    });
    this.resetAmounts();
  };

  updateFiatPrice = (fiatPrice: number) => {
    this.setState({
      fiatPrice
    });
  };

  handleTransactionInProgress = () => {
    this.setState({
      transactionInProgress: true
    });
  };

  handleTransactionCancel = () => {
    this.setState({
      transactionInProgress: false
    });
  };

  handleNewNodeFee = () => {
    this.setState({
      nodeFee: session.getNodeFee()
    });
  };

  handleDonate = () => {
    this.handleAddressChange(this.devContact);
  };

  handleAmountChange = (event: any) => {
    const { displayCurrency, fiatPrice, nodeFee } = this.state;
    let enteredAmount = event.target.value;
    if (enteredAmount === '') {
      this.setState({
        enteredAmount: '',
        totalAmount: ''
      });
      return;
    }
    if (enteredAmount === '.') {
      enteredAmount = '0.';
    }

    const regex = /^\d*(\.(\d\d?)?)?$/;
    if (!regex.test(enteredAmount) === true) {
      return;
    }

    const fee = displayCurrency === 'TRTL' ? 0.1 : 0.1 * fiatPrice;

    const totalAmount = (
      parseFloat(enteredAmount) +
      fee +
      parseFloat(nodeFee / 100)
    ).toFixed(2);
    this.setState({
      enteredAmount,
      totalAmount
    });
  };

  handleSendTransactionResponse = (
    event: Electron.IpcRendererEvent,
    message: any
  ) => {
    const { messageType, data } = message;
    if (messageType === 'sendTransactionResponse') {
      if (data.status === 'SUCCESS') {
        this.resetPaymentID();
      }
    }
  };

  handleSendToAddressChange = (event: any) => {
    const sendToAddress = event.target.value;
    this.setState({
      sendToAddress
    });
  };

  handleTotalAmountChange = (event: any) => {
    const { nodeFee } = this.state;
    let totalAmount = event.target.value;
    if (totalAmount === '') {
      this.setState({
        enteredAmount: '',
        totalAmount: ''
      });
      return;
    }
    if (totalAmount === '.') {
      totalAmount = '0.';
    }

    const regex = /^\d*(\.(\d\d?)?)?$/;
    if (!regex.test(totalAmount) === true) {
      return;
    }

    const subtractFee = Number(totalAmount) * 100 - 10 - parseInt(nodeFee, 10);

    const enteredAmount =
      subtractFee < 0 ? '' : atomicToHuman(subtractFee, false).toFixed(2);

    this.setState({
      enteredAmount,
      totalAmount
    });
  };

  confirmTransaction = (event: any) => {
    event.preventDefault();
    const {
      sendToAddress,
      totalAmount,
      paymentID,
      darkMode,
      displayCurrency,
      fiatSymbol,
      symbolLocation
    } = this.state;
    const { textColor } = uiType(darkMode);
    const sufficientFunds =
      (session.getUnlockedBalance() + session.getLockedBalance()) / 100 >=
      Number(totalAmount);

    const sufficientUnlockedFunds =
      session.getUnlockedBalance() > Number(totalAmount) / 100;

    if (sendToAddress === '' || totalAmount === '') {
      return;
    }

    if (!sufficientFunds) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The transaction was not successful. You don&apos;t have enough
            funds!
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
      return;
    }

    if (!sufficientUnlockedFunds) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The transaction was not successful.
          </p>
          <p className={`subtitle ${textColor}`}>
            You don&apos;t have enough unlocked funds! Wait until your funds
            unlock then try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
      return;
    }

    const message = (
      <div>
        <center>
          <p className={`title ${textColor}`}>Confirm Transaction</p>
        </center>
        <br />
        <p className={`subtitle ${textColor}`}>
          <b>Send to:</b>
          <br />
          {sendToAddress}
        </p>
        <p className={`subtitle ${textColor}`}>
          <b>Amount (w/ fee):</b>
          <br />
          {displayCurrency === 'fiat' &&
            symbolLocation === 'prefix' &&
            fiatSymbol}
          {totalAmount}
          {displayCurrency === 'fiat' &&
            symbolLocation === 'suffix' &&
            fiatSymbol}
        </p>
        {paymentID !== '' && (
          <p className={`subtitle ${textColor}`}>
            <b>Payment ID:</b>
            <br />
            {paymentID}
          </p>
        )}
      </div>
    );
    eventEmitter.emit(
      'openModal',
      message,
      'Send it!',
      'Wait a minute...',
      'confirmTransaction'
    );
  };

  sendTransaction = async () => {
    const { displayCurrency, fiatPrice, transactionInProgress } = this.state;

    if (transactionInProgress) {
      return;
    }

    eventEmitter.emit('transactionInProgress');

    const notSynced = session.getSyncStatus() < 99.99;
    const { sendToAddress, enteredAmount, paymentID, darkMode } = this.state;
    const { textColor } = uiType(darkMode);

    if (notSynced) {
      const message = (
        <div>
          <center>
            <p className="title has-text-danger">Error!</p>
          </center>
          <br />
          <p className={`subtitle ${textColor}`}>
            The transaction was not successful. The wallet isn&apos;t synced.
            Wait until you are synced and try again.
          </p>
        </div>
      );
      eventEmitter.emit('openModal', message, 'OK', null, 'transactionCancel');
      return;
    }
    const transactionData = {
      address: sendToAddress,
      amount:
        displayCurrency === 'TRTL'
          ? Number(enteredAmount) * 100
          : (Number(enteredAmount) * 100) / fiatPrice,
      paymentID
    };

    ipcRenderer.send('fromFrontend', 'sendTransactionRequest', transactionData);
  };

  createTestTransaction = async () => {
    log.debug('Creating test transaction for you.');
    const sendToAddress = await session.getPrimaryAddress();
    const amount = 100;
    const paymentID = this.generatePaymentID();

    await this.setState({
      selectedContact: { label: sendToAddress, value: sendToAddress },
      enteredAmount: String(amount / 100),
      totalAmount: String((amount + 10) / 100),
      sendToAddress,
      paymentID
    });
    this.sendTransaction();
  };

  generatePaymentID = () => {
    const paymentID = crypto.randomBytes(32).toString('hex');
    log.debug(`Generated paymentID: ${paymentID}`);
    this.setState({ paymentID });
    return paymentID;
  };

  handlePaymentIDChange = (event: any) => {
    this.setState({ paymentID: event.target.value });
  };

  resetPaymentID = () => {
    this.setState({
      paymentID: '',
      enteredAmount: '',
      totalAmount: '',
      sendToAddress: '',
      selectedContact: null
    });
  };

  resetAmounts = () => {
    this.setState({ enteredAmount: '', totalAmount: '' });
  };

  sendAll = () => {
    const { unlockedBalance, fiatPrice, displayCurrency, nodeFee } = this.state;

    const totalAmount =
      unlockedBalance - 10 - parseInt(nodeFee, 10) <= 0 ? 0 : unlockedBalance;
    const enteredAmount =
      unlockedBalance - 10 - parseInt(nodeFee, 10) <= 0
        ? 0
        : totalAmount - 10 - parseInt(nodeFee, 10);
    this.setState({
      totalAmount:
        displayCurrency === 'TRTL'
          ? atomicToHuman(totalAmount, false).toString()
          : atomicToHuman(totalAmount * fiatPrice, false).toString(),
      enteredAmount:
        displayCurrency === 'TRTL'
          ? atomicToHuman(enteredAmount, false).toString()
          : atomicToHuman(enteredAmount * fiatPrice, false).toString()
    });
  };

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    for (let i = 0; i < arrayToSearch.length; i++) {
      if (arrayToSearch[i][objectPropertyName] === searchedValue) {
        return arrayToSearch[i];
      }
    }
  }

  checkInputLength = (input: string) => {
    if (input.length > 1) {
      this.setState({
        menuIsOpen: true
      });
    } else {
      this.setState({
        menuIsOpen: false
      });
    }
  };

  handleAddressChange = (event: any) => {
    if (event) {
      // eslint-disable-next-line no-underscore-dangle
      if (event.__isNew__ || event.__isDonate__) {
        this.setState({
          selectedContact: { label: event.value, value: event.value },
          sendToAddress: event.value
        });
        return;
      }

      const { paymentID } = this.search(
        event.value,
        [donateInfo, ...addressList],
        'address'
      );

      this.setState({
        selectedContact: event,
        sendToAddress: event.value,
        paymentID: paymentID || ''
      });
    } else {
      this.setState({
        selectedContact: null
      });
    }
  };

  roundDown(x: number) {
    return Math.floor(x * 100) / 100;
  }

  render() {
    const {
      darkMode,
      enteredAmount,
      totalAmount,
      paymentID,
      transactionInProgress,
      displayCurrency,
      fiatSymbol,
      symbolLocation,
      sendToAddress,
      pageAnimationIn,
      selectedContact,
      menuIsOpen
    } = this.state;

    const exampleAmount =
      symbolLocation === 'prefix' ? `${fiatSymbol}100` : `100${fiatSymbol}`;

    const {
      backgroundColor,
      textColor,
      elementBaseColor,
      linkColor,
      toolTipColor
    } = uiType(darkMode);

    const addressInput = (
      <a
        href="#addressinput"
        onClick={event => event.preventDefault()}
        id="#addressinput"
      >
        <Creatable
          multi
          options={this.autoCompleteContacts}
          placeholder="Enter a TurtleCoin address or a contact name to send funds to"
          // eslint-disable-next-line no-unused-vars
          noOptionsMessage={inputValue => null}
          styles={customStyles}
          isClearable
          formatCreateLabel={value => {
            return `Send to ${value}`;
          }}
          value={selectedContact}
          onChange={this.handleAddressChange}
          id="autoCompleteAddress"
          menuIsOpen={menuIsOpen}
          onInputChange={this.checkInputLength}
        />
      </a>
    );

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}  hide-scrollbar`}>
          <ReactTooltip
            effect="solid"
            type={toolTipColor}
            multiline
            place="top"
          />
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor} ${pageAnimationIn}`}>
            <form onSubmit={this.confirmTransaction}>
              <div className="field">
                <div className="control">
                  <label
                    className={`label ${textColor}`}
                    htmlFor="autoCompleteAddress"
                  >
                    Send to
                    {addressInput}
                  </label>
                </div>
              </div>

              <div className="field" hidden>
                <label className={`label ${textColor}`} htmlFor="address">
                  {il8n.send_to_address}
                  <div className="control">
                    <input
                      className="input is-large"
                      type="text"
                      placeholder={il8n.send_to_address_input_placeholder}
                      value={sendToAddress}
                      onChange={this.handleSendToAddressChange}
                      id="address"
                    />
                  </div>
                </label>
              </div>
              <div className="field">
                <div className="control">
                  <div className="columns">
                    <div className="column">
                      <label className={`label ${textColor}`} htmlFor="amount">
                        {il8n.amount_to_send}
                        <input
                          className="input is-large"
                          type="text"
                          placeholder={`How much to send (eg. ${
                            displayCurrency === 'fiat'
                              ? exampleAmount
                              : '100 TRTL'
                          })`}
                          value={enteredAmount}
                          onChange={this.handleAmountChange}
                          id="amount"
                        />
                        <a
                          onClick={this.sendAll}
                          onKeyPress={this.sendAll}
                          role="button"
                          tabIndex={0}
                          className={linkColor}
                          onMouseDown={event => event.preventDefault()}
                        >
                          {il8n.send_all}
                        </a>
                      </label>
                    </div>
                    <div className="column">
                      <label
                        className={`label ${textColor}`}
                        htmlFor="totalamount"
                      >
                        {il8n.total_with_fees}
                        <input
                          className="input is-large"
                          type="text"
                          placeholder={il8n.total_with_fees_input_placeholder}
                          value={totalAmount}
                          onChange={this.handleTotalAmountChange}
                          id="totalamount"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="field">
                <label className={`label ${textColor}`} htmlFor="paymentid">
                  {il8n.payment_id}
                  <div className="control">
                    <input
                      className="input is-large"
                      type="text"
                      placeholder={il8n.payment_id_input_placeholder}
                      value={paymentID}
                      onChange={this.handlePaymentIDChange}
                      id="paymentid"
                    />
                    <a
                      onClick={this.generatePaymentID}
                      onKeyPress={this.generatePaymentID}
                      role="button"
                      tabIndex={0}
                      className={linkColor}
                      onMouseDown={event => event.preventDefault()}
                    >
                      {il8n.generate_payment_id}
                    </a>
                  </div>
                </label>
              </div>
              <div className="buttons">
                {!transactionInProgress && (
                  <button type="submit" className="button is-success is-large">
                    <span className="icon is-small">
                      <i className="fa fa-paper-plane" />
                    </span>
                    &nbsp;&nbsp;{il8n.send}
                  </button>
                )}
                {transactionInProgress && (
                  <button
                    type="submit"
                    className="button is-success is-large is-loading is-disabled"
                    disabled
                  >
                    <span className="icon is-small">
                      <i className="fa fa-paper-plane" />
                    </span>
                    &nbsp;&nbsp;{il8n.send}
                  </button>
                )}

                <button
                  type="reset"
                  className={`button is-large ${elementBaseColor}`}
                  onClick={this.resetPaymentID}
                >
                  <span className="icon is-small">
                    <i className="fa fa-undo" />
                  </span>
                  &nbsp;&nbsp;{il8n.clear}
                </button>
                {isDev && (
                  <div>
                    <a
                      className="button is-warning is-large"
                      onClick={this.createTestTransaction}
                      onKeyPress={this.createTestTransaction}
                      role="button"
                      tabIndex={0}
                      type="action"
                      onMouseDown={event => event.preventDefault()}
                    >
                      <span className="icon is-small">
                        <i className="fa fa-flask" />
                      </span>
                      &nbsp;&nbsp;Test
                    </a>
                  </div>
                )}
              </div>
            </form>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}

Send.defaultProps = {
  uriAddress: '',
  uriPaymentID: ''
};
