/**
 * Store the users current Workspace. Should be loaded from WorkspaceStorage.
 *
 * Includes the full row as stored in the `workspaceData` table.
 */
import { SET_WORKSPACE } from '../actionTypes';
import { mergeReducer } from './common';

export default mergeReducer(SET_WORKSPACE, null);
