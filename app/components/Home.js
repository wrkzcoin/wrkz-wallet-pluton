// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <Link to={routes.COUNTER}>{window.session.address}</Link>
        <p>Synchronization: {window.session.syncStatus}</p>
      </div>
    );
  }
}
