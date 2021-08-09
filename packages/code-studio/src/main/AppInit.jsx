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
import { setSession as setSessionAction } from '../redux/actions';
import App from './App';
import ToolType from '../tools/ToolType';
import PouchCommandHistoryStorage from '../storage/PouchCommandHistoryStorage';
import LocalWorkspaceStorage from '../dashboard/LocalWorkspaceStorage';
import WebdavLayoutStorage from './WebdavLayoutStorage';
import initSession from './initSession';

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
    setSession,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  } = props;

  const [error, setError] = useState();

  const initClient = useCallback(async () => {
    try {
      const loadedWorkspace = await WORKSPACE_STORAGE.load();
      const layouts = await LAYOUT_STORAGE.getLayouts();
      if (layouts.length > 0) {
        const layoutConfig = await LAYOUT_STORAGE.getLayout(layouts[0]);
        loadedWorkspace.data.layoutConfig = layoutConfig;
      }
      const loadedSession = await initSession();

      setActiveTool(ToolType.DEFAULT);
      setCommandHistoryStorage(COMMAND_HISTORY_STORAGE);
      setFileStorage(FILE_STORAGE);
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
  setSession: setSessionAction,
  setUser: setUserAction,
  setWorkspace: setWorkspaceAction,
  setWorkspaceStorage: setWorkspaceStorageAction,
})(AppInit);
