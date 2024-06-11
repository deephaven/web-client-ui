import type { LayoutStorage } from '@deephaven/app-utils';
import { SET_LAYOUT_STORAGE } from './actionTypes';

// eslint-disable-next-line import/prefer-default-export
export const setLayoutStorage = (
  layoutStorage: LayoutStorage
): { type: string; payload: LayoutStorage } => ({
  type: SET_LAYOUT_STORAGE,
  payload: layoutStorage,
});
