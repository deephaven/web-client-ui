import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import { LoadingOverlay } from '@deephaven/components';

const AppInit = lazy(() => import('./AppInit'));
const EmbedGridApp = lazy(() => import('./EmbedGridApp'));
const StyleGuideInit = lazy(() => import('../styleguide/StyleGuideInit'));

const AppRouter = () => (
  <Router basename={process.env.PUBLIC_URL}>
    <Suspense fallback={<LoadingOverlay />}>
      <Switch>
        <Route exact path="/" component={AppInit} />
        <Route path="/notebook/:notebookPath+" component={AppInit} />
        <Route path="/iframe/table" component={EmbedGridApp} />
        <Route path="/styleguide" component={StyleGuideInit} />
        <Redirect from="*" to="/" />
      </Switch>
    </Suspense>
  </Router>
);

export default AppRouter;
