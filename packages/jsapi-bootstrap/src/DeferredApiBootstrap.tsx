import React from 'react';
import useDeferredApi from './useDeferredApi';
import { ApiContext } from './ApiBootstrap';

type DeferredApiBootstrapProps = React.PropsWithChildren<{
  onError?: (error: unknown) => void;
  /**
   * Options to use when fetching the deferred API.
   */
  options?: Record<string, unknown>;
}>;

/**
 * Does not render children until the deferred API is resolved.
 */
export const DeferredApiBootstrap = React.memo(
  ({
    children,
    onError,
    options,
  }: DeferredApiBootstrapProps): JSX.Element | null => {
    const [api, apiError] = useDeferredApi(options);
    if (apiError != null) {
      onError?.(apiError);
      return null;
    }
    if (api == null) {
      // Still waiting for the API to load
      return null;
    }
    return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
  }
);

DeferredApiBootstrap.displayName = 'DeferredApiBootstrap';

export default DeferredApiBootstrap;
