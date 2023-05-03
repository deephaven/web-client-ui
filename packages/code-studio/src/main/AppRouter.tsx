import React, { ReactElement } from 'react';
import { Route, Redirect, Switch, HashRouter } from 'react-router-dom';
import AppInit from './AppInit';

function AppRouter(): ReactElement {
  return (
    <HashRouter basename={import.meta.env.BASE_URL}>
      <Switch>
        <Route exact path="/" component={AppInit} />
        <Route path="/notebook/:notebookPath+" component={AppInit} />
        <Redirect from="*" to="/" />
      </Switch>
    </HashRouter>
  );
}

export default AppRouter;
