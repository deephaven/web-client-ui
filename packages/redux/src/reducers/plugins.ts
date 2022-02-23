/**
 * The plugins that have been loaded
 */
import { SET_PLUGINS } from '../actionTypes';
import { replaceReducer } from './common';

export default replaceReducer(SET_PLUGINS, null);
