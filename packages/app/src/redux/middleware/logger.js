import Log from '@deephaven/log';

const log = Log.module('redux-logger');

const logger = store => next => action => {
  log.debug('dispatching', action);
  const result = next(action);
  log.debug('next state', store.getState());
  return result;
};

export default logger;
