import { createContext, useContext, useEffect, useState } from 'react';
import type { dh } from '@deephaven/jsapi-types';

/** Function for unsubscribing from a given subscription */
export type UnsubscribeFunction = () => void;

/**
 * Update with the current `fetch` fuonction and status of the object.
 * - If both `fetch` and `error` are `null`, it is still loading the fetcher
 * - If `fetch` is not `null`, the object is ready to be fetched
 * - If `error` is not `null`, there was an error loading the object
 */
export type ObjectFetchUpdate<T = unknown> = {
  /**
   * Function to fetch the object. If `null`, the object is still loading or there was an error.
   */
  fetch: (() => Promise<T>) | null;

  /**
   * Error that occurred while fetching the object. If `null`, there was no error.
   * Will automatically retry when possible while the subscribed.
   */
  error: unknown | null;
};

/** ObjectFetchManager for managing a subscription to an object using a VariableDescriptor */
export type ObjectFetchManager = {
  /**
   *
   * @param descriptor Descriptor object to fetch the object from. Can be extended by a specific implementation to include more details necessary for the ObjectManager.
   * @param onUpdate Callback function to be called when the object is updated.
   * @returns An unsubscribe function to stop listening for updates and clean up the object.
   */
  subscribe: <T = unknown>(
    descriptor: dh.ide.VariableDescriptor,
    onUpdate: (update: ObjectFetchUpdate<T>) => void
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
  const [currentUpdate, setCurrentUpdate] = useState<ObjectFetchUpdate<T>>(
    () => ({
      fetch: null,
      error: null,
    })
  );

  const objectFetchManager = useContext(ObjectFetchManagerContext);

  useEffect(() => {
    if (objectFetchManager == null) {
      setCurrentUpdate({
        fetch: null,
        error: new Error('No ObjectFetchManager available in context'),
      });
      return;
    }
    // Signal that we're still loading
    setCurrentUpdate({
      fetch: null,
      error: null,
    });
    return objectFetchManager.subscribe(descriptor, setCurrentUpdate);
  }, [descriptor, objectFetchManager]);

  return currentUpdate;
}
