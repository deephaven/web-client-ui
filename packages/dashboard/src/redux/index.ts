import { reducerRegistry } from '@deephaven/redux';
import reducers from './reducers';

Object.entries(reducers).map(([name, reducer]) =>
  reducerRegistry.register(name, reducer)
);

export * from './actions';
export * from './actionTypes';
export * from './selectors';
