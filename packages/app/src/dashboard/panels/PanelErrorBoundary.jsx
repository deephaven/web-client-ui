import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { LoadingOverlay } from '@deephaven/components';
import Log from '@deephaven/log';
import { GLPropTypes } from '../../include/prop-types';
import { PanelEvent } from '../events';
import LayoutUtils from '../../layout/LayoutUtils';
import './PanelErrorBoundary.scss';

const log = Log.module('PanelErrorBoundary');

/**
 * Panel wrapper implementing Error Boundary and emitting Closed event.
 * Closed event has to be emitted from the wrapper instead of the panel itself
 * because the panel can get unmounted on errors
 * and we want to differentiate between unmount on error vs panel being intentionally closed.
 */
class PanelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error) {
    this.setState({ error });
  }

  componentWillUnmount() {
    const { glContainer, glEventHub } = this.props;
    const panelId = LayoutUtils.getIdFromContainer(glContainer);
    log.debug('componentWillUnmount', panelId);
    glEventHub.emit(PanelEvent.CLOSED, panelId, glContainer);
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;
    if (error != null) {
      return (
        <div className="panel-error-boundary">
          <LoadingOverlay
            errorMessage={`${error}`}
            isLoading={false}
            isLoaded={false}
          />
        </div>
      );
    }
    return children;
  }
}

PanelErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
};

export default PanelErrorBoundary;
