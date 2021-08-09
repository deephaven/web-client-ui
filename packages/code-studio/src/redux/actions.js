import { SET_SESSION } from './actionTypes';

// eslint-disable-next-line import/prefer-default-export
export const setSession = session => ({
  type: SET_SESSION,
  payload: session,
});
