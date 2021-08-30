/**
 * Set the layout storage object being used to load/save the layout
 */
import { replaceReducer } from '@deephaven/redux';
import { SET_LAYOUT_STORAGE } from '../actionTypes';

export default replaceReducer(SET_LAYOUT_STORAGE, null);
