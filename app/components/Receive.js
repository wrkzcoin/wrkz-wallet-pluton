// @flow
import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import ReactTooltip from 'react-tooltip';
import { session, il8n } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';
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

  constructor(props?: Props) {
    super(props);
    this.state = {
      darkMode: session.darkMode
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    const { copyToClipboard } = this.props;
    const { darkMode } = this.state;
    const { backgroundColor, textColor } = uiType(darkMode);

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor}`}>
          <ReactTooltip
            effect="solid"
            border
            type="light"
            multiline
            place="top"
          />
          <NavBar />
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
                        type="button"
                        className="button is-success is-large"
                        onClick={() => copyToClipboard(session.address)}
                      >
                        {il8n.copy_to_clipboard}
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
          <BottomBar />
        </div>
      </div>
    );
  }
}
