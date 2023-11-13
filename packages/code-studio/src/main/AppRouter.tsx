import React, { ReactElement } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import AppInit from './AppInit';

const StyleGuideRoot = React.lazy(() => import('../styleguide/StyleGuideRoot'));

const baseURI = new URL(document.baseURI).pathname;

function AppRouter(): ReactElement {
  return (
    <Router basename={baseURI}>
      <Switch>
        <Route exact path="/" component={AppInit} />
        <Route
          path={`/${import.meta.env.VITE_ROUTE_NOTEBOOKS}:notebookPath+`}
          component={AppInit}
        />
        <Route path="/styleguide" component={StyleGuideRoot} />
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
  );
}

export default AppRouter;
