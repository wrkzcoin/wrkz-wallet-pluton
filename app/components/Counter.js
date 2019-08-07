// @flow
import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import ReactTooltip from 'react-tooltip';
import { session } from '../index';
import NavBar from './NavBar';
import BottomBar from './BottomBar';
import Redirector from './Redirector';

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

    return (
      <div>
        <Redirector />
        {darkMode === false && (
          <div className="wholescreen">
            <ReactTooltip
              effect="solid"
              border
              type="dark"
              multiline
              place="top"
            />
            <NavBar />
            <div className="maincontent">
              <div className="columns">
                <div className="column is-three-quarters">
                  <form>
                    <div className="field">
                      <label className="label" htmlFor="receiveaddress">
                        Receiving Address
                        <textarea
                          className="textarea is-family-monospace is-large"
                          rows="6"
                          value={session.address}
                          id="receiveaddress"
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
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="column">
                  <div className="field">
                    <p className="has-text-weight-bold">QR Code</p>
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
        )}
        {darkMode === true && (
          <div className="wholescreen has-background-dark">
            <ReactTooltip
              effect="solid"
              border
              type="light"
              multiline
              place="top"
            />
            <NavBar />
            <div className="maincontent has-background-dark">
              <div className="columns">
                <div className="column is-three-quarters">
                  <form>
                    <div className="field">
                      <label
                        className="label has-text-white"
                        htmlFor="receiveaddress"
                      >
                        Receiving Address
                        <textarea
                          className="textarea is-family-monospace is-large"
                          rows="6"
                          value={session.address}
                          id="receiveaddress"
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
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="column">
                  <div className="field">
                    <p className="has-text-weight-bold has-text-white">
                      QR Code
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
        )}
      </div>
    );
  }
}
