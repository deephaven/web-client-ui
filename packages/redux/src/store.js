import { applyMiddleware, createStore, compose, combineReducers } from 'redux';
import rootMiddleware from './middleware';
import reducers from './reducers';
import reducerRegistry from './reducerRegistry';

// TODO #70: Separate all reducers into their respective modules, register from there
Object.entries(reducers).map(([name, reducer]) =>
  reducerRegistry.register(name, reducer)
);

/* eslint-disable-next-line no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  combineReducers(reducerRegistry.reducers),
  composeEnhancers(applyMiddleware(...rootMiddleware))
);

reducerRegistry.setListener(newReducers => {
  store.replaceReducer(combineReducers(newReducers));
});

export default store;
