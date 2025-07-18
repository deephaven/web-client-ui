import { createContext, useContext, useEffect, useState } from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ApiContext } from './ApiBootstrap';
import { type UriVariableDescriptor } from './useObjectFetcher';

/**
 * Function to fetch an API based on a provided descriptor object.
 * Depending on the context there may be more properties on the descriptor,
 * providing more information about the object, such as a session ID.
 * @param descriptor Descriptor object or URI to fetch the API from.
 * @returns A promise that resolves to the API instance for the provided variable descriptor.
 */
export type DeferredApiFetcher = (
  descriptor: DhType.ide.VariableDescriptor | UriVariableDescriptor
) => Promise<typeof DhType>;

export const DeferredApiContext = createContext<
  typeof DhType | DeferredApiFetcher | null
>(null);

/**
 * Retrieve the API for the current context, given the widget provided.
 * The API may need to be loaded, and will return `null` until it is ready.
 * @param widget The widget descriptor or URI to use to fetch the API
 * @returns A tuple with the API instance, and an error if one occurred.
 */
export function useDeferredApi(
  widget: DhType.ide.VariableDescriptor | UriVariableDescriptor | null
): [dh: typeof DhType | null, error: unknown | null] {
  const [api, setApi] = useState<typeof DhType | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const deferredApi = useContext(DeferredApiContext);
  const contextApi = useContext(ApiContext);

  useEffect(() => {
    if (deferredApi == null) {
      if (contextApi != null) {
        setApi(contextApi);
        setError(null);
        return;
      }
      setApi(null);
      setError(
        new Error(
          'No API available in useDeferredApi. Was code wrapped in ApiBootstrap or DeferredApiContext.Provider?'
        )
      );
      return;
    }
    let isCancelled = false;

    async function loadApi() {
      if (widget == null) {
        if (!isCancelled) {
          setApi(null);
          setError(new Error('No widget provided to useDeferredApi'));
        }
      } else if (typeof deferredApi === 'function') {
        try {
          const newApi = await deferredApi(widget);
          if (!isCancelled) {
            setApi(newApi);
            setError(null);
          }
        } catch (e) {
          if (!isCancelled) {
            setApi(null);
            setError(e);
          }
        }
      } else {
        setApi(deferredApi);
      }
    }

    loadApi();

    return () => {
      isCancelled = true;
    };
  }, [contextApi, deferredApi, widget]);

  return [api, error];
}

export default useDeferredApi;
