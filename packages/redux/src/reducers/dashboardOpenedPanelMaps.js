/**
 * Store information about the panels opened in this dashboard
 */
import { SET_DASHBOARD_OPENED_PANEL_MAP } from '../actionTypes';
import { replaceByIdReducer } from './common';

export default replaceByIdReducer(SET_DASHBOARD_OPENED_PANEL_MAP, {}, false);
