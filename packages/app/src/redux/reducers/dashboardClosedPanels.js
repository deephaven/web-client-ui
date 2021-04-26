/**
 * Store information about the panels closed in this dashboard
 */
import { SET_DASHBOARD_CLOSED_PANELS } from '../actionTypes';
import { replaceByIdReducer } from './common';

export default replaceByIdReducer(SET_DASHBOARD_CLOSED_PANELS);
