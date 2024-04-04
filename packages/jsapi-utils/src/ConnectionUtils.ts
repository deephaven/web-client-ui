import type { dh } from '@deephaven/jsapi-types';
import { TimeoutError } from '@deephaven/utils';

/** Default timeout for fetching a variable definition */
export const FETCH_TIMEOUT = 10_000;

/**
 * Fetch the definition for a variable given a connection. Subscribes to field updates and triggers when the variable is found.
 * @param connection Connection to get the variable from
 * @param name Name of the definition to fetch
 * @param timeout Timeout for the fetch
 * @returns Promise the resolves to the variable definition if found, or rejects if there's an error or the timeout has exceeded
 */
export function fetchVariableDefinition(
  connection: dh.IdeConnection,
  name: string,
  timeout = FETCH_TIMEOUT
): Promise<dh.ide.VariableDefinition> {
  return new Promise<dh.ide.VariableDefinition>((resolve, reject) => {
    let removeListener: () => void;

    const timeoutId = setTimeout(() => {
      removeListener?.();
      reject(new TimeoutError(`Timeout looking for variable ${name}`));
    }, timeout);

    /**
     * Checks if the variable we're looking for is in the changes, and resolves the promise if it does
     * @param changes Variables changes that have occurred
     */
    function handleFieldUpdates(changes: dh.ide.VariableChanges): void {
      const definition = changes.created.find(def => def.title === name);
      clearTimeout(timeoutId);
      removeListener?.();
      if (definition != null) {
        resolve(definition);
      } else {
        reject(new Error(`Variable ${name} not found`));
      }
    }

    removeListener = connection.subscribeToFieldUpdates(handleFieldUpdates);
  });
}
