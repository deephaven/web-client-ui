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

/**
 * Initialize data needed for the styleguide
 */
const StyleGuideInit = (props: {
  workspace: Workspace;
  setWorkspace: PayloadActionCreator<Workspace>;
}) => {
  const { workspace, setWorkspace } = props;

  useEffect(() => {
    setWorkspace(LocalWorkspaceStorage.makeDefaultWorkspace() as Workspace);
  }, [setWorkspace]);

  return <>{workspace && <StyleGuide />}</>;
};

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

export default connect(mapStateToProps, {
  setWorkspace: setWorkspaceAction,
})(StyleGuideInit);
