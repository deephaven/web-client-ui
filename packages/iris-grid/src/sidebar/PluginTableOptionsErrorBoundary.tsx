import React, { type ErrorInfo, type ReactNode } from 'react';
import Log from '@deephaven/log';

const log = Log.module('PluginTableOptionsErrorBoundary');

type Props = {
  /** Identifier for the failing item, used for log correlation. */
  itemType: string;
  children: ReactNode;
};

type State = { error: Error | null };

/**
 * Tiny error boundary scoped to a single plugin-supplied sidebar page.
 * If the plugin's `configPage` throws during render, we log the error
 * once and render a minimal fallback ("<name> failed to render:" + the
 * thrown message) rather than tearing down the entire `IrisGrid`
 * subtree or leaving a blank panel. Used only by the page-switch
 * `default` case in `IrisGrid.tsx`.
 */
export default class PluginTableOptionsErrorBoundary extends React.Component<
  Props,
  State
> {
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const { itemType } = this.props;
    log.error(
      `Plugin sidebar page "${itemType}" threw during render; suppressing.`,
      error,
      info
    );
  }

  render(): ReactNode {
    const { error } = this.state;
    const { children, itemType } = this.props;
    if (error == null) {
      return children;
    }
    return (
      <div
        className="plugin-sidebar-error"
        role="alert"
        data-testid="plugin-sidebar-error"
      >
        <p>{itemType} failed to render:</p>
        <p>{error.message}</p>
      </div>
    );
  }
}
