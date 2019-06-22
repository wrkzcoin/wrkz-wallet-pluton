import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HomePage from './containers/HomePage';
import CounterPage from './containers/CounterPage';
import SendPage from './containers/SendPage';
import AddressesPage from './containers/AddressesPage';
import ImportPage from './containers/ImportPage';
import ImportKeyPage from './containers/ImportKeyPage';
import SettingsPage from './containers/SettingsPage';

export default () => (
  <App>
    <Switch>
      <Route exact path={routes.COUNTER} component={CounterPage} />
      <Route exact path={routes.HOME} component={HomePage} />
      <Route exact path={routes.SEND} component={SendPage} />
      <Route exact path={routes.ADDRESSES} component={AddressesPage} />
      <Route exact path={routes.IMPORT} component={ImportPage} />
      <Route exact path={routes.IMPORTKEY} component={ImportKeyPage} />
      <Route exact path={routes.SETTINGS} component={SettingsPage} />
    </Switch>
  </App>
);
