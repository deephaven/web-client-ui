import { SET_LAYOUT_STORAGE } from './actionTypes';

// eslint-disable-next-line import/prefer-default-export
export const setLayoutStorage = layoutStorage => ({
  type: SET_LAYOUT_STORAGE,
  payload: layoutStorage,
});
