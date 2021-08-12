import { SET_LAYOUT_STORAGE, SET_SESSION } from './actionTypes';

export const setSession = session => ({
  type: SET_SESSION,
  payload: session,
});

export const setLayoutStorage = layoutStorage => ({
  type: SET_LAYOUT_STORAGE,
  payload: layoutStorage,
});
