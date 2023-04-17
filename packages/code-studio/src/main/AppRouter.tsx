import React, { ReactElement } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AppInit from './AppInit';

function AppRouter(): ReactElement {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Switch>
        <Route path="/notebook/:notebookPath+" component={AppInit} />
        <Route path="*" component={AppInit} />
      </Switch>
    </Router>
  );
}

export default AppRouter;
