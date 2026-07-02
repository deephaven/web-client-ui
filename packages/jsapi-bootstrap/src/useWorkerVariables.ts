import { useCallback, useContext, useSyncExternalStore } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { getWorkerKey, type WorkerVariables } from '@deephaven/jsapi-utils';
import WorkerVariablesContext from './WorkerVariablesContext';

/**
 * Subscribe to the live list of variables on the worker identified by
 * `descriptor`. Returns `null` while the worker connection is being resolved
 * or when no {@link WorkerVariablesContext} provider is mounted; returns the
 * cumulative list (with field-update deltas applied) once the first update
 * arrives.
 *
 * Subscriptions are ref-counted by worker key so multiple consumers targeting
 * the same worker share a single underlying `subscribeToFieldUpdates` call.
 */
export function useWorkerVariables(
  descriptor:
    | Partial<dh.ide.VariableDescriptor>
    | Record<string, unknown>
    | null
    | undefined
): WorkerVariables | null {
  const store = useContext(WorkerVariablesContext);
  const key = getWorkerKey(descriptor);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (store == null) return () => undefined;
      return store.subscribe(key, listener);
    },
    [store, key]
  );

  const getSnapshot = useCallback(
    () => (store == null ? null : store.snapshot(key)),
    [store, key]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default useWorkerVariables;
