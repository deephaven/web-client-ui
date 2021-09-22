import { SET_SESSION_WRAPPER } from './actionTypes';

// eslint-disable-next-line import/prefer-default-export
export const setSessionWrapper = sessionWrapper => ({
  type: SET_SESSION_WRAPPER,
  payload: sessionWrapper,
});
