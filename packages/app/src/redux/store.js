import { applyMiddleware, createStore, compose } from 'redux';
import rootMiddleware from './middleware';
import rootReducer from './reducers';

/* eslint-disable-next-line no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export default createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(...rootMiddleware))
);
