/**
 * Store the current `FileStorage` instance for this user.
 * Use this instance to read/write data from storage.
 */
import { SET_FILE_STORAGE } from '../../actionTypes';
import { replaceReducer } from '../common';

export default replaceReducer(SET_FILE_STORAGE, null);
