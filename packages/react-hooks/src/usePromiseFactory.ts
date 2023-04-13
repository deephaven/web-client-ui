/* eslint-disable import/prefer-default-export */
import React from 'react';

/**
 * Configuration options for `usePromiseFactory` hook.
 */
export interface UsePromiseFactoryOptions {
  /**
   * If true, promise factory will automatically be called in a useEffect.
   * Allows deferring the load until a condition is met or for cases where we
   * want to load explicitly via the returned `reload` function.
   * Defaults to true.
   */
  autoLoad?: boolean;
}

/**
 * Return type of `usePromiseFactory` hook.
 */
export interface UsePromiseFactoryResult<T> {
  /** Data from resolved promise. Will be null if promise fails or has not completed. */
  data: T | null;

  /** Error or error string if promise fails. */
  error: Error | string | null;

  /** true if promise fails. */
  isError: boolean;

  /** true if promise is pending. */
  isLoading: boolean;

  /** Reload the promise factory. */
  reload: () => Promise<T | null>;
}

/**
 * Manages the result of a promise factory function in a synchronous way.
 * @param promiseFactory
 * @param args arguments to pass to the factory function.
 * @returns object containing resolved data or error information.
 */
export default function usePromiseFactory<T, TArgs extends unknown[]>(
  promiseFactory: (...args: TArgs) => Promise<T>,
  args: TArgs,
  { autoLoad = true }: UsePromiseFactoryOptions = {}
): UsePromiseFactoryResult<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadPromise = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const resolved = await promiseFactory(...args);
      setData(resolved);
      setError(null);
      return resolved;
    } catch (err) {
      setData(null);
      setError(err as Error | string);
      return null;
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promiseFactory, ...args]);

  React.useEffect(() => {
    if (autoLoad) {
      loadPromise();
    }
  }, [autoLoad, loadPromise]);

  return {
    data,
    error,
    isError: error != null,
    isLoading,
    reload: loadPromise,
  };
}
