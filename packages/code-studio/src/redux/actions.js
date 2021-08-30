import { SET_LAYOUT_STORAGE, SET_SESSION_WRAPPER } from './actionTypes';

export const setSessionWrapper = sessionWrapper => ({
  type: SET_SESSION_WRAPPER,
  payload: sessionWrapper,
});

export const setLayoutStorage = layoutStorage => ({
  type: SET_LAYOUT_STORAGE,
  payload: layoutStorage,
});
