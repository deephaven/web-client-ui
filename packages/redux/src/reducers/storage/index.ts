import { combineReducers } from 'redux';

import commandHistoryStorage from './commandHistoryStorage';
import fileStorage from './fileStorage';
import workspaceStorage from './workspaceStorage';

export default combineReducers({
  commandHistoryStorage,
  fileStorage,
  workspaceStorage,
});
