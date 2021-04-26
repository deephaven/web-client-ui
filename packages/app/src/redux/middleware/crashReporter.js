import Log from '@deephaven/log';

const log = Log.module('redux-crashReporter');

const crashReporter = store => next => action => {
  try {
    return next(action);
  } catch (err) {
    log.error(
      'Error executing',
      action,
      ' with state ',
      store.getState(),
      ':',
      err
    );
    throw err;
  }
};

export default crashReporter;
