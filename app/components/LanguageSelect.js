// @flow
import React, { Component } from 'react';

type Props = {};

type State = {};

export default class LanguageSelect extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="control statusicons">
        <div className="tags has-addons">
          <div className="dropdown is-up">
            <div className="dropdown-trigger">
              <button
                className="button"
                aria-haspopup="true"
                aria-controls="dropdown-menu7"
              >
                <span>Dropup button</span>
                <span className="icon is-small">
                  <i className="fas fa-angle-up" aria-hidden="true" />
                </span>
              </button>
            </div>
            <div className="dropdown-menu" id="dropdown-menu7" role="menu">
              <div className="dropdown-content">
                <div className="dropdown-item">
                  <p>
                    You can add the <code>is-up</code> modifier to have a
                    dropdown menu that appears above the dropdown button.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
