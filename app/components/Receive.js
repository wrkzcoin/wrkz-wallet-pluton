// @flow
//
// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import ReactTooltip from 'react-tooltip';
import { session, il8n } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import Modal from './Modal';
import uiType from '../utils/uitype';

type Props = {
  copyToClipboard: string => void
};

type State = {
  darkMode: boolean
};

export default class Receive extends Component<Props, State> {
  props: Props;

  state: State;

  ref: any;

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
    this.handleCopiedTip = this.handleCopiedTip.bind(this);
    this.ref = null;
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleCopiedTip = () => {
    ReactTooltip.show(this.ref);
    setTimeout(() => {
      ReactTooltip.hide(this.ref);
    }, 500);
  };

  render() {
    const { copyToClipboard } = this.props;
    const { darkMode } = this.state;
    const { backgroundColor, textColor, toolTipColor } = uiType(darkMode);

    const copiedTip = 'Copied!';

    return (
      <div>
        <Redirector />
        <Modal darkMode={darkMode} />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            type={toolTipColor}
            multiline
            place="top"
            effect="solid"
          />
          <NavBar darkMode={darkMode} />
          <div className={`maincontent ${backgroundColor}`}>
            <div className="columns">
              <div className="column is-three-quarters">
                <form>
                  <div className="field">
                    <label
                      className={`label ${textColor}`}
                      htmlFor="receiveaddress"
                    >
                      {il8n.receiving_address}
                      <textarea
                        className="textarea is-family-monospace is-large"
                        rows="6"
                        value={session.address}
                        readOnly
                      />
                    </label>
                  </div>
                  <div className="field">
                    <div className="buttons">
                      <button
                        // eslint-disable-next-line no-return-assign
                        ref={ref => (this.ref = ref)}
                        type="button"
                        className="button is-success is-large"
                        onClick={() => {
                          copyToClipboard(session.address);
                          this.handleCopiedTip();
                        }}
                        data-tip={copiedTip}
                        data-event="none"
                        data-effect="float"
                      >
                        <span className="icon is-small">
                          <i className="fa fa-clipboard" />
                        </span>
                        &nbsp;&nbsp;{il8n.copy_to_clipboard}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="column">
                <div className="field">
                  <p className={`has-text-weight-bold ${textColor}`}>
                    {il8n.qr_code}
                  </p>
                  <div className="box has-background-light">
                    <center>
                      <span>
                        <QRCode
                          value={session.address}
                          renderAs="svg"
                          bgColor="#f5f5f5"
                          size={200}
                        />
                      </span>
                    </center>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}
