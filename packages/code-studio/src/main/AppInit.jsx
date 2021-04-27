import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  setActiveTool as setActiveToolAction,
  setCommandHistoryStorage as setCommandHistoryStorageAction,
  setUser as setUserAction,
  setWorkspace as setWorkspaceAction,
  setWorkspaceStorage as setWorkspaceStorageAction,
} from '../redux/actions';
import { getWorkspace, getWorkspaceStorage } from '../redux/selectors';
import App from './App';
import ToolType from '../tools/ToolType';
import WorkspaceStorage from '../dashboard/WorkspaceStorage';
import PouchCommandHistoryStorage from '../console/command-history/PouchCommandHistoryStorage';

// Default values used
// TODO: core#11, core#8
const NAME = 'user';
const USER = { name: NAME, operateAs: NAME };
const WORKSPACE = WorkspaceStorage.makeDefaultWorkspace();
const WORKSPACE_STORAGE = new WorkspaceStorage();
const COMMAND_HISTORY_STORAGE = new PouchCommandHistoryStorage();

/**
 * Component that sets some default values needed
 */
const AppInit = props => {
  const {
    workspace,
    setActiveTool,
    setCommandHistoryStorage,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  } = props;

  const initClient = useCallback(() => {
    setActiveTool(ToolType.DEFAULT);
    setCommandHistoryStorage(COMMAND_HISTORY_STORAGE);
    setUser(USER);
    setWorkspace(WORKSPACE);
    setWorkspaceStorage(WORKSPACE_STORAGE);
  }, [
    setActiveTool,
    setCommandHistoryStorage,
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
  setUser: setUserAction,
  setWorkspace: setWorkspaceAction,
  setWorkspaceStorage: setWorkspaceStorageAction,
})(AppInit);
