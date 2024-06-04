import { createContext, useContext, useEffect, useState } from 'react';
import type { dh } from '@deephaven/jsapi-types';

/** Function for unsubscribing from a given subscription */
export type UnsubscribeFunction = () => void;

/** Update when the ObjectFetch is still loading */
export type ObjectFetchLoading = {
  status: 'loading';
};

/** Update when the ObjectFetch has errored */
export type ObjectFetchError = {
  error: NonNullable<unknown>;
  status: 'error';
};

/** Update when the object is ready */
export type ObjectFetchReady<T> = {
  fetch: () => Promise<T>;
  status: 'ready';
};

/**
 * Update with the current `fetch` function and status of the object.
 * - If both `fetch` and `error` are `null`, it is still loading the fetcher
 * - If `fetch` is not `null`, the object is ready to be fetched
 * - If `error` is not `null`, there was an error loading the object
 */
export type ObjectFetchUpdate<T = unknown> =
  | ObjectFetchLoading
  | ObjectFetchError
  | ObjectFetchReady<T>;

export type ObjectFetchUpdateCallback<T = unknown> = (
  update: ObjectFetchUpdate<T>
) => void;

/** ObjectFetchManager for managing a subscription to an object using a VariableDescriptor */
export type ObjectFetchManager = {
  /**
   * Subscribe to the fetch function for an object using a variable descriptor.
   * It's possible that the fetch function changes over time, due to disconnection/reconnection, starting/stopping of applications that the object may be associated with, etc.
   *
   * @param descriptor Descriptor object of the object to fetch. Can be extended by a specific implementation to include more details necessary for the ObjectManager.
   * @param onUpdate Callback function to be called when the object is updated.
   * @returns An unsubscribe function to stop listening for fetch updates and clean up the object.
   */
  subscribe: <T = unknown>(
    descriptor: dh.ide.VariableDescriptor,
    onUpdate: ObjectFetchUpdateCallback<T>
  ) => UnsubscribeFunction;
};

/** Context for tracking an implementation of the ObjectFetchManager. */
export const ObjectFetchManagerContext =
  createContext<ObjectFetchManager | null>(null);

/**
 * Retrieve a `fetch` function for the given variable descriptor.
 *
 * @param descriptor Descriptor to get the `fetch` function for
 * @returns An object with the current `fetch` function, OR an error status set if there was an issue fetching the object.
 *          Retrying is left up to the ObjectManager implementation used from this context.
 */
export function useObjectFetch<T = unknown>(
  descriptor: dh.ide.VariableDescriptor
): ObjectFetchUpdate<T> {
  const [currentUpdate, setCurrentUpdate] = useState<ObjectFetchUpdate<T>>({
    status: 'loading',
  });

  const objectFetchManager = useContext(ObjectFetchManagerContext);

  useEffect(() => {
    if (objectFetchManager == null) {
      setCurrentUpdate({
        error: new Error('No ObjectFetchManager available in context'),
        status: 'error',
      });
      return;
    }
    // Update to signal we're still loading, if we're not already in a loading state.
    setCurrentUpdate(oldUpdate =>
      oldUpdate.status === 'loading' ? oldUpdate : { status: 'loading' }
    );
    return objectFetchManager.subscribe(descriptor, setCurrentUpdate);
  }, [descriptor, objectFetchManager]);

  return currentUpdate;
}
