import React, { ReactElement } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import AppInit from './AppInit';

function AppRouter(): ReactElement {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Switch>
        <Route exact path="/" component={AppInit} />
        <Route
          path={`/${import.meta.env.VITE_ROUTE_NOTEBOOKS}:notebookPath+`}
          component={AppInit}
        />
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
  );
}

export default AppRouter;
