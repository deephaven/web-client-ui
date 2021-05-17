/**
 * Use a separate flag for `isLoggedIn` so we can log the user out and reset the session after the animation has completed.
 * Otherwise, we risk unloading a bunch of things that are needed by many components, and we'll get errors on logout.
 *
 * After the animation has completed, a reset should be called.
 */
import { SET_IS_LOGGED_IN } from '../actionTypes';
import { replaceReducer } from './common';

export default replaceReducer(SET_IS_LOGGED_IN, false);
