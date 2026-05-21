import React, { type ErrorInfo, type ReactNode } from 'react';
import Log from '@deephaven/log';

const log = Log.module('PluginSidebarErrorBoundary');

type Props = {
  /** Identifier for the failing item, used for log correlation. */
  itemType: string;
  /**
   * Optional callback to pop the failing page off the sidebar stack.
   * When provided, the fallback UI shows a Back button wired to it.
   */
  onBack?: () => void;
  children: ReactNode;
};

type State = { hasError: boolean };

/**
 * Tiny error boundary scoped to a single plugin-supplied sidebar page.
 * If the plugin's `configPage` throws during render, we log the error
 * once and render a minimal fallback ("Failed to render" + Back button)
 * rather than tearing down the entire `IrisGrid` subtree or leaving a
 * blank panel. Used only by the page-switch `default` case in
 * `IrisGrid.tsx`.
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
    const { children, itemType, onBack } = this.props;
    if (!hasError) {
      return children;
    }
    return (
      <div
        className="plugin-sidebar-error"
        role="alert"
        data-testid="plugin-sidebar-error"
      >
        <p>
          This sidebar page (<code>{itemType}</code>) failed to render.
        </p>
        {onBack != null && (
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
      </div>
    );
  }
}
