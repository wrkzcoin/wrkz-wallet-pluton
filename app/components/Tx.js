// @flow
import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import ReactTooltip from 'react-tooltip';
import { session, eventEmitter } from '../index';

type Props = {};

type State = {};

export default class Tx extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props?: Props) {
    super(props);
  }

  render() {
    return (
      <tr key={tx[1]}>
        <td
          data-tip={
            tx[0] === 0
              ? 'This transaction is unconfirmed. Should be confirmed within 30 seconds!'
              : `Block ${tx[4]}`
          }
        >
          {tx[0] === 0 && (
            <p className="has-text-danger">Unconfirmed</p>
          )}
          {tx[0] > 0 && (
            <p>{session.convertTimestamp(tx[0])}</p>
          )}
        </td>
        <td>{tx[1]}</td>
        {tx[2] < 0 && (
          <td>
            <p className="has-text-danger has-text-right">
              {session.atomicToHuman(tx[2], true)}
            </p>
          </td>
        )}
        {tx[2] > 0 && (
          <td>
            <p className="has-text-right">
              {session.atomicToHuman(tx[2], true)}
            </p>
          </td>
        )}
        <td>
          <p className="has-text-right">
            {session.atomicToHuman(tx[3], true)}
          </p>
        </td>
      </tr>
    );
  }
}
