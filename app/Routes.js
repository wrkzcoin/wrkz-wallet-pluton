import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HomePage from './containers/HomePage';
import CounterPage from './containers/CounterPage';
import SendPage from './containers/SendPage';
import AddressesPage from './containers/AddressesPage';

export default () => (
  <App>
    <Switch>
      <Route exact path={routes.COUNTER} component={CounterPage} />
      <Route exact path={routes.HOME} component={HomePage} />
      <Route exact path={routes.SEND} component={SendPage} />
      <Route exact path={routes.ADDRESSES} component={AddressesPage} />
    </Switch>
  </App>
);
