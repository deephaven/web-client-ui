import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import AppInit from './AppInit';
import StyleGuideInit from '../styleguide/StyleGuideInit';

const AppRouter = () => (
  <Router basename={process.env.REACT_APP_ROUTER_BASE_NAME}>
    <Switch>
      <Route exact path="/" component={AppInit} />
      <Route path="/styleguide" component={StyleGuideInit} />
      <Redirect from="*" to="/" />
    </Switch>
  </Router>
);

export default AppRouter;
