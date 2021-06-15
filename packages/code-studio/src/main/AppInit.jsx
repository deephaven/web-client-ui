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
import WorkspaceStorage from '../dashboard/WorkspaceStorage';
import PouchCommandHistoryStorage from '../storage/PouchCommandHistoryStorage';

// Default values used
const webdavClient = createClient(process.env.REACT_APP_NOTEBOOKS_URL ?? '');
const NAME = 'user';
const USER = { name: NAME, operateAs: NAME };
const WORKSPACE = WorkspaceStorage.makeDefaultWorkspace();
const WORKSPACE_STORAGE = new WorkspaceStorage();
const COMMAND_HISTORY_STORAGE = new PouchCommandHistoryStorage();
const FILE_STORAGE = new WebdavFileStorage(webdavClient);

// TODO: Remove this, just for testing
window.webdavClient = webdavClient;

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

  const initClient = useCallback(() => {
    setActiveTool(ToolType.DEFAULT);
    setCommandHistoryStorage(COMMAND_HISTORY_STORAGE);
    setFileStorage(FILE_STORAGE);
    setUser(USER);
    setWorkspace(WORKSPACE);
    setWorkspaceStorage(WORKSPACE_STORAGE);
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
