/**
 * Store the current grid columnd selection validator for a dashboard
 */
import { SET_DASHBOARD_COLUMN_SELECTION_VALIDATOR } from '../actionTypes';
import { replaceByIdReducer } from './common';

export default replaceByIdReducer(SET_DASHBOARD_COLUMN_SELECTION_VALIDATOR);
