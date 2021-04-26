/**
 * The active tool the user currently has selected
 */
import { SET_ACTIVE_TOOL } from '../actionTypes';
import { replaceReducer } from './common';

export default replaceReducer(SET_ACTIVE_TOOL, null);
