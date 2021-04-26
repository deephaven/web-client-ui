import { combineReducers } from 'redux';

import commandHistoryStorage from './commandHistoryStorage';
import workspaceStorage from './workspaceStorage';

export default combineReducers({
  commandHistoryStorage,
  workspaceStorage,
});
