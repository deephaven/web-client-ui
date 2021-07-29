import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { WebdavFileStorage } from '@deephaven/file-explorer';
import {
  getWorkspace,
  getWorkspaceStorage,
  setActiveTool as setActiveToolAction,
  setCommandHistoryStorage as setCommandHistoryStorageAction,
  setFileStorage as setFileStorageAction,
  setUser as setUserAction,
  setWorkspace as setWorkspaceAction,
  setWorkspaceStorage as setWorkspaceStorageAction,
} from '@deephaven/redux';
import { createClient } from 'webdav/web';
import App from './App';
import ToolType from '../tools/ToolType';
import PouchCommandHistoryStorage from '../storage/PouchCommandHistoryStorage';
import LocalWorkspaceStorage from '../dashboard/LocalWorkspaceStorage';
import WebdavLayoutStorage from './WebdavLayoutStorage';

// Default values used
const webdavClient = createClient(process.env.REACT_APP_NOTEBOOKS_URL ?? '');
const NAME = 'user';
const USER = { name: NAME, operateAs: NAME };
const WORKSPACE_STORAGE = new LocalWorkspaceStorage();
const COMMAND_HISTORY_STORAGE = new PouchCommandHistoryStorage();
const FILE_STORAGE = new WebdavFileStorage(webdavClient);
const LAYOUT_STORAGE = new WebdavLayoutStorage(webdavClient);

/**
 * Component that sets some default values needed
 */
const AppInit = props => {
  const {
    workspace,
    setActiveTool,
    setCommandHistoryStorage,
    setFileStorage,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  } = props;

  const initClient = useCallback(async () => {
    const loadedWorkspace = await WORKSPACE_STORAGE.load();
    try {
      const layouts = await LAYOUT_STORAGE.getLayouts();
      console.log('Found layouts', layouts);
      if (layouts.length > 0) {
        const layoutConfig = await LAYOUT_STORAGE.getLayout(layouts[0]);
        console.log('Layout loaded!', layoutConfig);
        loadedWorkspace.data.layoutConfig = layoutConfig;
      }
    } catch (e) {
      console.error('Unable to get layouts!', e);
      // TODO: Clean this up
    }

    setActiveTool(ToolType.DEFAULT);
    setCommandHistoryStorage(COMMAND_HISTORY_STORAGE);
    setFileStorage(FILE_STORAGE);
    setUser(USER);
    setWorkspaceStorage(WORKSPACE_STORAGE);
    setWorkspace(loadedWorkspace);
  }, [
    setActiveTool,
    setCommandHistoryStorage,
    setFileStorage,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  ]);

  useEffect(() => {
    initClient();
  }, [initClient]);

  return <>{workspace && <App />}</>;
};

AppInit.propTypes = {
  workspace: PropTypes.shape({}),
  workspaceStorage: PropTypes.shape({ close: PropTypes.func }),

  setActiveTool: PropTypes.func.isRequired,
  setCommandHistoryStorage: PropTypes.func.isRequired,
  setFileStorage: PropTypes.func.isRequired,
  setUser: PropTypes.func.isRequired,
  setWorkspace: PropTypes.func.isRequired,
  setWorkspaceStorage: PropTypes.func.isRequired,
};

AppInit.defaultProps = {
  workspace: null,
  workspaceStorage: null,
};

const mapStateToProps = state => ({
  workspace: getWorkspace(state),
  workspaceStorage: getWorkspaceStorage(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  setCommandHistoryStorage: setCommandHistoryStorageAction,
  setFileStorage: setFileStorageAction,
  setUser: setUserAction,
  setWorkspace: setWorkspaceAction,
  setWorkspaceStorage: setWorkspaceStorageAction,
})(AppInit);
