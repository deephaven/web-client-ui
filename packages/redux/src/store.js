import { applyMiddleware, createStore, compose, combineReducers } from 'redux';
import rootMiddleware from './middleware';
import reducerRegistry from './reducerRegistry';

/* eslint-disable-next-line no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  combineReducers(reducerRegistry.reducers),
  composeEnhancers(applyMiddleware(...rootMiddleware))
);

reducerRegistry.setListener(reducers => {
  store.replaceReducer(combineReducers(reducers));
});

export default store;
