/**
 * Store information about the current user.
 */
import { SET_USER } from '../actionTypes';
import { mergeReducer } from './common';

export default mergeReducer(SET_USER, null);
