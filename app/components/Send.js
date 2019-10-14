// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.

/* eslint-disable jsx-a11y/label-has-associated-control */

import crypto from 'crypto';
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
import uiType from '../utils/uitype';

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
  loopTest: boolean,
  looping: boolean,
  pageAnimationIn: string,
  selectedContact: any
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

  loopInterval: IntervalID | null;

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
      loopTest: loginCounter.loopTest,
      looping: loginCounter.looping,
      pageAnimationIn: loginCounter.getAnimation('/send'),
      selectedContact: null
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
    this.toggleLoopTest = this.toggleLoopTest.bind(this);
    this.loopInterval = null;
    this.autoCompleteContacts = addressList.map(contact => {
      return { label: contact.name, value: contact.address };
    });
  }

  componentDidMount() {
    eventEmitter.on('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.on('transactionCancel', this.handleTransactionCancel);
    eventEmitter.on('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.on('modifyCurrency', this.modifyCurrency);
    eventEmitter.on('confirmTransaction', this.sendTransaction);
    // eslint-disable-next-line react/destructuring-assignment
    if (this.props && this.props.uriAddress) {
      const { uriAddress } = this.props;

      const selectedContact = this.search(
        uriAddress,
        this.autoCompleteContacts,
        'value'
      );

      this.setState({
        selectedContact
      });
    }
  }

  componentWillUnmount() {
    const { looping } = this.state;
    eventEmitter.off('transactionInProgress', this.handleTransactionInProgress);
    eventEmitter.off('transactionCancel', this.handleTransactionCancel);
    eventEmitter.off('gotFiatPrice', this.updateFiatPrice);
    eventEmitter.off('modifyCurrency', this.modifyCurrency);
    eventEmitter.off('confirmTransaction', this.sendTransaction);
    if (looping) {
      clearInterval(this.loopInterval);
      loginCounter.looping = false;
    }
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

  handleAmountChange = (event: any) => {
    const { displayCurrency, fiatPrice } = this.state;
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
      parseFloat(session.daemon.feeAmount / 100)
    ).toFixed(2);
    this.setState({
      enteredAmount,
      totalAmount
    });
  };

  handleSendToAddressChange = (event: any) => {
    const sendToAddress = event.target.value;
    this.setState({
      sendToAddress
    });
  };

  handleTotalAmountChange = (event: any) => {
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

    const subtractFee =
      Number(totalAmount) * 100 - 10 - parseInt(session.daemon.feeAmount, 10);

    const enteredAmount =
      subtractFee < 0
        ? ''
        : session.atomicToHuman(subtractFee, false).toFixed(2);

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
    const {
      loopTest,
      displayCurrency,
      fiatPrice,
      transactionInProgress
    } = this.state;

    if (transactionInProgress) {
      return;
    }

    eventEmitter.emit('transactionInProgress');

    const notSynced = session.getSyncStatus() < 99.99;
    const { sendToAddress, enteredAmount, paymentID, darkMode } = this.state;
    const { textColor } = uiType(darkMode);

    const [hash, err] = await session.sendTransaction(
      sendToAddress,
      displayCurrency === 'TRTL'
        ? Number(enteredAmount) * 100
        : (Number(enteredAmount) * 100) / fiatPrice,
      paymentID
    );
    if (!loopTest) {
      if (hash) {
        eventEmitter.emit('transaction');
        const message = (
          <div>
            <center>
              <p className={`title ${textColor}`}>Success!</p>
            </center>
            <br />
            <p className={`subtitle ${textColor}`}>
              Transaction succeeded! Transaction hash:
            </p>
            <p className={`subtitle ${textColor}`}>{hash}</p>
          </div>
        );
        eventEmitter.emit(
          'openModal',
          message,
          'OK',
          null,
          'transactionCancel'
        );
        this.resetPaymentID();
      } else if (err) {
        if (notSynced) {
          const message = (
            <div>
              <center>
                <p className="title has-text-danger">Error!</p>
              </center>
              <br />
              <p className={`subtitle ${textColor}`}>
                The transaction was not successful. The wallet isn&apos;t
                synced. Wait until you are synced and try again.
              </p>
            </div>
          );
          eventEmitter.emit(
            'openModal',
            message,
            'OK',
            null,
            'transactionCancel'
          );
        } else {
          log.debug(err);
          const message = (
            <div>
              <center>
                <p className="title has-text-danger">Error!</p>
              </center>
              <br />
              <p className={`subtitle ${textColor}`}>
                The transaction was not successful.
              </p>
              <p className={`subtitle ${textColor}`}>{err.toString()}</p>
            </div>
          );
          eventEmitter.emit(
            'openModal',
            message,
            'OK',
            null,
            'transactionCancel'
          );
        }
      }
    }
    eventEmitter.emit('transactionCancel');
  };

  createTestTransaction = async () => {
    const { loopTest, looping } = this.state;

    log.debug('Creating test transaction for you.');
    const sendToAddress = await session.wallet.getPrimaryAddress();
    const amount = Math.floor(Math.random() * 100) + 1;
    const paymentID = this.generatePaymentID();

    await this.setState({
      selectedContact: { label: sendToAddress, value: sendToAddress },
      enteredAmount: String(amount / 100),
      totalAmount: String((amount + 10) / 100),
      sendToAddress,
      paymentID
    });

    if (loopTest && !looping) {
      loginCounter.looping = true;
      this.setState({
        looping: true
      });
      this.loopInterval = setInterval(this.createTestTransaction, 1000);
    }

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
    const { unlockedBalance, fiatPrice, displayCurrency } = this.state;

    const totalAmount =
      unlockedBalance - 10 - parseInt(session.daemon.feeAmount, 10) <= 0
        ? 0
        : unlockedBalance;
    const enteredAmount =
      unlockedBalance - 10 - parseInt(session.daemon.feeAmount, 10) <= 0
        ? 0
        : totalAmount - 10 - parseInt(session.daemon.feeAmount, 10);
    this.setState({
      totalAmount:
        displayCurrency === 'TRTL'
          ? session.atomicToHuman(totalAmount, false).toString()
          : session.atomicToHuman(totalAmount * fiatPrice, false).toString(),
      enteredAmount:
        displayCurrency === 'TRTL'
          ? session.atomicToHuman(enteredAmount, false).toString()
          : session.atomicToHuman(enteredAmount * fiatPrice, false).toString()
    });
  };

  toggleLoopTest = () => {
    const { loopTest, looping } = this.state;
    if (looping) {
      clearInterval(this.loopInterval);
      loginCounter.looping = false;
      this.setState({
        looping: false
      });
    }
    loginCounter.loopTest = !loopTest;
    this.setState({
      loopTest: !loopTest
    });
  };

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    for (let i = 0; i < arrayToSearch.length; i++) {
      if (arrayToSearch[i][objectPropertyName] === searchedValue) {
        return arrayToSearch[i];
      }
    }
  }

  handleAddressChange = (event: any) => {
    if (event) {
      // eslint-disable-next-line no-underscore-dangle
      if (event.__isNew__) {
        this.setState({
          selectedContact: { label: event.value, value: event.value },
          sendToAddress: event.value
        });
        return;
      }

      const { paymentID } = this.search(event.value, addressList, 'address');

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
      loopTest,
      looping,
      pageAnimationIn,
      selectedContact
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
                    <Creatable
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
                      multi
                    />
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
                      disabled={looping}
                    >
                      <span className="icon is-small">
                        <i className="fa fa-flask" />
                      </span>
                      &nbsp;&nbsp;Test
                    </a>
                    {loopTest === true && looping === true && (
                      <span className={textColor}>
                        <a
                          className="button is-primary is-large"
                          onClick={this.toggleLoopTest}
                          onKeyPress={this.toggleLoopTest}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="icon is-large">
                            <i className="fas fa-sync fa-spin" />
                          </span>
                        </a>
                        &nbsp;&nbsp; Looping in progress. Click to disable.
                      </span>
                    )}

                    {loopTest === true && looping === false && (
                      <span className={textColor}>
                        <a
                          className="button is-success is-large"
                          onClick={this.toggleLoopTest}
                          onKeyPress={this.toggleLoopTest}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="icon is-large">
                            <i className="fas fa-check" />
                          </span>
                        </a>
                        &nbsp;&nbsp; Loop Test: <b>on</b>
                      </span>
                    )}
                    {loopTest === false && (
                      <span className={textColor}>
                        <a
                          className="button is-danger is-large"
                          onClick={this.toggleLoopTest}
                          onKeyPress={this.toggleLoopTest}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="icon is-large">
                            <i className="fas fa-times" />
                          </span>
                        </a>
                        &nbsp;&nbsp; Loop Test: <b>off</b>
                      </span>
                    )}
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
