import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { LoadingOverlay } from '@deephaven/components';
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
import {
  setLayoutStorage as setLayoutStorageAction,
  setSession as setSessionAction,
} from '../redux/actions';
import App from './App';
import ToolType from '../tools/ToolType';
import PouchCommandHistoryStorage from '../storage/PouchCommandHistoryStorage';
import LocalWorkspaceStorage from '../dashboard/LocalWorkspaceStorage';
import WebdavLayoutStorage from './WebdavLayoutStorage';
import { createSession } from './SessionUtils';
import UserLayoutUtils from './UserLayoutUtils';

// Default values used
const NAME = 'user';
const USER = { name: NAME, operateAs: NAME };
const WORKSPACE_STORAGE = new LocalWorkspaceStorage();
const COMMAND_HISTORY_STORAGE = new PouchCommandHistoryStorage();
const FILE_STORAGE = new WebdavFileStorage(
  createClient(process.env.REACT_APP_NOTEBOOKS_URL ?? '')
);
const LAYOUT_STORAGE = new WebdavLayoutStorage(
  createClient(process.env.REACT_APP_LAYOUTS_URL ?? '')
);
/**
 * Component that sets some default values needed
 */
const AppInit = props => {
  const {
    workspace,
    setActiveTool,
    setCommandHistoryStorage,
    setFileStorage,
    setLayoutStorage,
    setSession,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  } = props;

  const [error, setError] = useState();

  const initClient = useCallback(async () => {
    try {
      const loadedWorkspace = await WORKSPACE_STORAGE.load();
      const loadedSession = await createSession();
      const { data } = loadedWorkspace;
      if (data.layoutConfig == null) {
        // User doesn't have a saved layout yet, load the default
        const layoutConfig = await UserLayoutUtils.getDefaultLayout();
        data.layoutConfig = layoutConfig;
      }

      setActiveTool(ToolType.DEFAULT);
      setCommandHistoryStorage(COMMAND_HISTORY_STORAGE);
      setFileStorage(FILE_STORAGE);
      setLayoutStorage(LAYOUT_STORAGE);
      setSession(loadedSession);
      setUser(USER);
      setWorkspaceStorage(WORKSPACE_STORAGE);
      setWorkspace(loadedWorkspace);
    } catch (e) {
      setError(e);
    }
  }, [
    setActiveTool,
    setCommandHistoryStorage,
    setFileStorage,
    setLayoutStorage,
    setSession,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  ]);

  useEffect(() => {
    initClient();
  }, [initClient]);

  const isLoading = !workspace && !error;
  const isLoaded = !isLoading && !error;
  const errorMessage = error ? `${error}` : null;

  return (
    <>
      {isLoaded && <App />}
      <LoadingOverlay
        isLoading={isLoading}
        isLoaded={isLoaded}
        errorMessage={errorMessage}
      />
    </>
  );
};

AppInit.propTypes = {
  workspace: PropTypes.shape({}),
  workspaceStorage: PropTypes.shape({ close: PropTypes.func }),

  setActiveTool: PropTypes.func.isRequired,
  setCommandHistoryStorage: PropTypes.func.isRequired,
  setFileStorage: PropTypes.func.isRequired,
  setLayoutStorage: PropTypes.func.isRequired,
  setSession: PropTypes.func.isRequired,
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
  setLayoutStorage: setLayoutStorageAction,
  setSession: setSessionAction,
  setUser: setUserAction,
  setWorkspace: setWorkspaceAction,
  setWorkspaceStorage: setWorkspaceStorageAction,
})(AppInit);
