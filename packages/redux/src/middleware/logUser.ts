import type { Middleware } from 'redux';
import { getLogIndexedDbHistory } from '@deephaven/log';
import { SET_USER } from '../actionTypes';
import type { RootState, User } from '../store';

/**
 * Attributes persisted browser logs to the logged-in user, so a support export
 * only includes that user's logs. Lives in the store so every app that
 * dispatches setUser gets it without its own wiring. Must run before any
 * middleware that logs, so the SET_USER action itself, which carries the
 * user's groups and permissions, is attributed to the new user.
 */
const logUser: Middleware = store => next => action => {
  const { type, payload } = action as {
    type?: unknown;
    payload?: Partial<User> | null;
  };
  if (type === SET_USER && payload != null) {
    // Mirrors the merge reducer, since the session must switch before reducing
    const name = payload.name ?? (store.getState() as RootState).user?.name;
    if (name != null) {
      getLogIndexedDbHistory()?.setUser(name);
    }
  }
  return next(action);
};

export default logUser;
