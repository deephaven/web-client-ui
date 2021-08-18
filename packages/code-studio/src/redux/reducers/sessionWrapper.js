/**
 * Set the active session being used to communicate with the server.
 */
import { replaceReducer } from '@deephaven/redux';
import { SET_SESSION_WRAPPER } from '../actionTypes';

export default replaceReducer(SET_SESSION_WRAPPER, null);
