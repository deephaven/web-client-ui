import React, { type ErrorInfo, type ReactNode } from 'react';
import Log from '@deephaven/log';

const log = Log.module('PluginSidebarErrorBoundary');

type Props = {
  /** Identifier for the failing item, used for log correlation. */
  itemType: string;
  children: ReactNode;
};

type State = { hasError: boolean };

/**
 * Tiny error boundary scoped to a single plugin-supplied sidebar page.
 * If the plugin's `configPage` throws during render, we log the error
 * once and render nothing in its place rather than tearing down the
 * entire `IrisGrid` subtree. Used only by the page-switch `default`
 * arm in `IrisGrid.tsx`.
 */
export default class PluginSidebarErrorBoundary extends React.Component<
  Props,
  State
> {
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  state: State = { hasError: false };

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const { itemType } = this.props;
    log.error(
      `Plugin sidebar page "${itemType}" threw during render; suppressing.`,
      error,
      info
    );
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children } = this.props;
    return hasError ? null : children;
  }
}
