import type { Middleware } from 'redux';
import { getLogIndexedDbHistory } from '@deephaven/log';
import { SET_USER } from '../actionTypes';
import type { RootState } from '../store';

/**
 * Binds persisted browser logs to the logged-in user, so a support export only
 * includes that user's sessions. Lives in the store so every app that
 * dispatches setUser gets it without its own wiring.
 */
const logUser: Middleware = store => next => action => {
  const result = next(action);
  if ((action as { type?: unknown }).type === SET_USER) {
    // SET_USER merges into the previous state, so read the name after reducing
    const name = (store.getState() as RootState).user?.name;
    if (name != null) {
      getLogIndexedDbHistory()?.setUser(name);
    }
  }
  return result;
};

export default logUser;
