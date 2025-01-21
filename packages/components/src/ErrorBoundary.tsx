import Log from '@deephaven/log';
import React, { Component, type ReactNode } from 'react';
import LoadingOverlay from './LoadingOverlay';

const log = Log.module('ErrorBoundary');

export interface ErrorBoundaryProps {
  /** Children to catch errors from */
  children: ReactNode;

  /** Classname to wrap the error message with */
  className?: string;

  /** Callback for when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  /** Custom fallback element */
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  error?: Error;
}

/**
 * Error boundary for catching render errors in React. Displays an error message if an error is caught by default, or you can specify a fallback component to render.
 * https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: undefined };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError } = this.props;
    log.error('Error caught by ErrorBoundary', error, errorInfo);
    onError?.(error, errorInfo);
  }

  render(): ReactNode {
    const { children, className, fallback } = this.props;
    const { error } = this.state;
    if (error != null) {
      if (fallback != null) {
        return fallback;
      }

      return (
        <div className={className}>
          <LoadingOverlay
            errorMessage={`${error}`}
            isLoading={false}
            isLoaded={false}
          />
        </div>
      );
    }

    // We need to check for undefined children because React will throw an error if we return undefined from a render method
    // Note this behaviour was changed in React 18: https://github.com/reactwg/react-18/discussions/75
    return children ?? null;
  }
}

export default ErrorBoundary;
