import React, { ReactElement } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import AppInit from './AppInit';

const AppRouter = (): ReactElement => (
  <Router basename={import.meta.env.BASE_URL}>
    <Switch>
      <Route exact path="/" component={AppInit} />
      <Route path="/notebook/:notebookPath+" component={AppInit} />
      <Redirect from="*" to="/" />
    </Switch>
  </Router>
);

export default AppRouter;
