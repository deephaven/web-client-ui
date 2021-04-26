/**
 * Store information about isolated linker panels set in a dashboard
 */
import { SET_DASHBOARD_ISOLATED_LINKER_PANEL_ID } from '../actionTypes';
import { replaceByIdReducer } from './common';

export default replaceByIdReducer(
  SET_DASHBOARD_ISOLATED_LINKER_PANEL_ID,
  {},
  false
);
