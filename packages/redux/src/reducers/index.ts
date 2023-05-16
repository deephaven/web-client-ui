import api from './api';
import activeTool from './activeTool';
import plugins from './plugins';
import storage from './storage';
import user from './user';
import workspace from './workspace';
import serverConfigValues from './serverConfigValues';

const reducers = {
  activeTool,
  api,
  plugins,
  storage,
  user,
  workspace,
  serverConfigValues,
};

export default reducers;
