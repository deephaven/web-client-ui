/**
 * Store information about input filters set in a dashboard
 */
import { replaceByIdReducer } from '@deephaven/redux';
import { SET_DASHBOARD_DATA } from '../actionTypes';

export default replaceByIdReducer(SET_DASHBOARD_DATA, {}, false);
