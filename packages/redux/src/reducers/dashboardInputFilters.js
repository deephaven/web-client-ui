/**
 * Store information about input filters set in a dashboard
 */
import { SET_DASHBOARD_INPUT_FILTERS } from '../actionTypes';
import { replaceByIdReducer } from './common';

export default replaceByIdReducer(SET_DASHBOARD_INPUT_FILTERS, {}, false);
