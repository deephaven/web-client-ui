/**
 * Set the active session being used to communicate with the server.
 */
import { replaceReducer } from '@deephaven/redux';
import { SET_CONNECTION } from '../actionTypes';

export default replaceReducer(SET_CONNECTION, null);
