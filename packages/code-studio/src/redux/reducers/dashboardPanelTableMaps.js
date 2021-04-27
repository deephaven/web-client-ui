/**
 * Store information about tables open in a dashboard.
 * Map of panelId -> table
 */
import { SET_DASHBOARD_PANEL_TABLE_MAP } from '../actionTypes';
import { replaceByIdReducer } from './common';

export default replaceByIdReducer(SET_DASHBOARD_PANEL_TABLE_MAP, {}, false);
