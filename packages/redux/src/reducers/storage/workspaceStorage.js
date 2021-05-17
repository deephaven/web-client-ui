/**
 * Store the current `WorkspaceStorage` instance for this user.
 * Use this instance to read/write data from workspace storage.
 */
import { SET_WORKSPACE_STORAGE } from '../../actionTypes';
import { replaceReducer } from '../common';

export default replaceReducer(SET_WORKSPACE_STORAGE, null);
