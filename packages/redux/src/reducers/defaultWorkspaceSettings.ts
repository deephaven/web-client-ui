/**
 * Default values for workspace settings. Used when the user has not modified a setting yet.
 */
import { SET_DEFAULT_WORKSPACE_SETTINGS } from '../actionTypes';
import { replaceReducer } from './common';

export default replaceReducer(SET_DEFAULT_WORKSPACE_SETTINGS, null);
