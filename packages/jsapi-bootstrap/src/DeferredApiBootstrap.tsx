import React from 'react';
import { VariableDescriptor } from '@deephaven/jsapi-types';
import useDeferredApi from './useDeferredApi';
import { ApiContext } from './ApiBootstrap';

type DeferredApiBootstrapProps = React.PropsWithChildren<{
  onError?: (error: unknown) => void;
  /**
   * Descriptor for the widget to load. Passed into an `ObjectFetcher` to load the widget.
   * The descriptor may be extended to include session information or other data required to identify the widget.
   * The surrounding `ObjectFetcherContext` will then be able to use that information to correctly load the widget.
   */
  widget: VariableDescriptor;
}>;

/**
 * Does not render children until the deferred API is resolved.
 */
export const DeferredApiBootstrap = React.memo(
  ({
    children,
    onError,
    widget,
  }: DeferredApiBootstrapProps): JSX.Element | null => {
    const [api, apiError] = useDeferredApi(widget);
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
