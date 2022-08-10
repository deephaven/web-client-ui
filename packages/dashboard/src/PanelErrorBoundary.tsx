import React, { Component, ReactNode } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import { Container, EventEmitter } from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import PanelEvent from './PanelEvent';
import LayoutUtils from './layout/LayoutUtils';
import './PanelErrorBoundary.scss';

const log = Log.module('PanelErrorBoundary');

interface PanelErrorBoundaryProps {
  children: ReactNode;
  glContainer: Container;
  glEventHub: EventEmitter;
}

interface PanelErrorBoundaryState {
  error: Error | null;
}
/**
 * Panel wrapper implementing Error Boundary and emitting Closed event.
 * Closed event has to be emitted from the wrapper instead of the panel itself
 * because the panel can get unmounted on errors
 * and we want to differentiate between unmount on error vs panel being intentionally closed.
 */
class PanelErrorBoundary extends Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  constructor(props: PanelErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error): void {
    this.setState({ error });
  }

  componentWillUnmount(): void {
    const { glContainer, glEventHub } = this.props;
    const panelId = LayoutUtils.getIdFromContainer(glContainer);
    log.debug('componentWillUnmount', panelId);
    glEventHub.emit(PanelEvent.CLOSED, panelId, glContainer);
  }

  render(): ReactNode {
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

export default PanelErrorBoundary;
