import { createContext, useContext, useEffect, useState } from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ApiContext } from './ApiBootstrap';

/** Options for retrieving the deferred */
export type DeferredApiOptions = Record<string, unknown>;

export type DeferredApiFetcher = (
  options?: DeferredApiOptions
) => Promise<typeof DhType>;

export const DeferredApiContext = createContext<
  typeof DhType | DeferredApiFetcher | null
>(null);

/**
 * Retrieve the API for the current context, given the metadata provided.
 * The API may need to be loaded, and will return `null` until it is ready.
 * @returns A tuple with the API instance, and an error if one occurred.
 */
export function useDeferredApi(
  options?: Record<string, unknown>
): [typeof DhType | null, unknown | null] {
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
      if (typeof deferredApi === 'function') {
        try {
          const newApi = await deferredApi(options);
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
  }, [contextApi, deferredApi, options]);

  return [api, error];
}

export default useDeferredApi;
