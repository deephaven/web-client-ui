import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  getWorkspace,
  PayloadActionCreator,
  RootState,
  setWorkspace as setWorkspaceAction,
  Workspace,
} from '@deephaven/redux';
import StyleGuide from './StyleGuide';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';
import { ExportedLayout } from '../storage/LayoutStorage';

/**
 * Initialize data needed for the styleguide
 */
function StyleGuideInit(props: {
  workspace: Workspace;
  setWorkspace: PayloadActionCreator<Workspace>;
}) {
  const { workspace, setWorkspace } = props;

  useEffect(() => {
    LocalWorkspaceStorage.makeDefaultWorkspace({
      getLayouts: async () => [] as string[],
      getLayout: async () => ({}) as ExportedLayout,
    }).then(setWorkspace);
  }, [setWorkspace]);

  return workspace != null ? <StyleGuide /> : null;
}

StyleGuideInit.propTypes = {
  workspace: PropTypes.shape({}),
  setWorkspace: PropTypes.func.isRequired,
};

StyleGuideInit.defaultProps = {
  workspace: null,
};

const mapStateToProps = (state: RootState) => ({
  workspace: getWorkspace(state),
});

const ConnectedStyleGuideInit = connect(mapStateToProps, {
  setWorkspace: setWorkspaceAction,
})(StyleGuideInit);

export default ConnectedStyleGuideInit;
