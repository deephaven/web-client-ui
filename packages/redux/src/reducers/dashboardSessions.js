/**
 * Store information about columns open in a dashboard
 */
import { SET_DASHBOARD_SESSION } from '../actionTypes';
import { replaceByIdReducer } from './common';

export default replaceByIdReducer(SET_DASHBOARD_SESSION, {}, false);
