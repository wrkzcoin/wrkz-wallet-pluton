import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HomePage from './containers/HomePage';
import ReceivePage from './containers/ReceivePage';
import SendPage from './containers/SendPage';
import ImportPage from './containers/ImportPage';
import ImportKeyPage from './containers/ImportKeyPage';
import SettingsPage from './containers/SettingsPage';
import LoginPage from './containers/LoginPage';
import ChangePasswordPage from './containers/ChangePasswordPage';
import FirstStartupPage from './containers/FirstStartupPage';

export default () => (
  <App>
    <Switch>
      <Route exact path={routes.RECEIVE} component={ReceivePage} />
      <Route exact path={routes.HOME} component={HomePage} />
      <Route exact path={routes.SEND} component={SendPage} />
      <Route exact path={routes.IMPORT} component={ImportPage} />
      <Route exact path={routes.IMPORTKEY} component={ImportKeyPage} />
      <Route exact path={routes.SETTINGS} component={SettingsPage} />
      <Route exact path={routes.LOGIN} component={LoginPage} />
      <Route exact path={routes.FIRSTSTARTUP} component={FirstStartupPage} />
      <Route
        exact
        path={routes.CHANGEPASSWORD}
        component={ChangePasswordPage}
      />
    </Switch>
  </App>
);
