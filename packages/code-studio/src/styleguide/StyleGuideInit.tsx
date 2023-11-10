import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  CustomizableWorkspace,
  getWorkspace,
  PayloadActionCreator,
  RootState,
  setWorkspace as setWorkspaceAction,
} from '@deephaven/redux';
import StyleGuide from './StyleGuide';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';
import { ExportedLayout } from '../storage/LayoutStorage';

/**
 * Initialize data needed for the styleguide
 */
function StyleGuideInit(props: {
  workspace: CustomizableWorkspace;
  setWorkspace: PayloadActionCreator<CustomizableWorkspace>;
}): JSX.Element | null {
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

const mapStateToProps = (
  state: RootState
): {
  workspace: CustomizableWorkspace;
} => ({
  workspace: getWorkspace(state),
});

const ConnectedStyleGuideInit = connect(mapStateToProps, {
  setWorkspace: setWorkspaceAction,
})(StyleGuideInit);

export default ConnectedStyleGuideInit;
