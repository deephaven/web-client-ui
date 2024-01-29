import { createContext, useContext, useEffect, useState } from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ApiContext } from './ApiBootstrap';
import { ObjectMetadata } from './useObjectFetcher';

export type DeferredApiFetcher = (metadata?: ObjectMetadata) => Promise<DhType>;

export const DeferredApiContext = createContext<
  DhType | DeferredApiFetcher | null
>(null);

/**
 * Retrieve the API for the current context, given the object metadata provided.
 * The API may need to be loaded, and will return `null` until it is ready.
 * @param metadata The object metadata to use to fetch the API
 * @returns A tuple with the API instance, and an error if one occurred.
 */
export function useDeferredApi(
  metadata: ObjectMetadata
): [DhType | null, unknown | null] {
  const [api, setApi] = useState<DhType | null>(null);
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
          const newApi = await deferredApi(metadata);
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
  }, [contextApi, deferredApi, metadata]);

  return [api, error];
}

export default useDeferredApi;
