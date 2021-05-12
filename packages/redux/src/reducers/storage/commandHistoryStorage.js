/**
 * Store the current `CommandHistoryStorage` instance for this user.
 * Use this instance to read/write data from dashboard storage.
 */
import { SET_COMMAND_HISTORY_STORAGE } from '../../actionTypes';
import { replaceReducer } from '../common';

export default replaceReducer(SET_COMMAND_HISTORY_STORAGE, null);
