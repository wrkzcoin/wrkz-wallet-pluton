// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';

type Props = {
  updateSync: () => void,
};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <Link to={routes.COUNTER}>{window.session.address}</Link>
        <p>Synchronized: {window.session.syncStatus}%</p>
        <p>Available Balance: 0.00 TRTL</p>
        <p>Locked Balance: 0.00 TRTL</p>
      </div>
    );
  }
}
