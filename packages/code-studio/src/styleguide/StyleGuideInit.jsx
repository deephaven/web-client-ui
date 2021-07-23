import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  getWorkspace,
  setWorkspace as setWorkspaceAction,
} from '@deephaven/redux';
import StyleGuide from './StyleGuide';
import LocalWorkspaceStorage from '../dashboard/LocalWorkspaceStorage';

/**
 * Initialize data needed for the styleguide
 */
const StyleGuideInit = props => {
  const { workspace, setWorkspace } = props;

  useEffect(() => {
    setWorkspace(LocalWorkspaceStorage.makeDefaultWorkspace());
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

const mapStateToProps = state => ({
  workspace: getWorkspace(state),
});

export default connect(mapStateToProps, {
  setWorkspace: setWorkspaceAction,
})(StyleGuideInit);
