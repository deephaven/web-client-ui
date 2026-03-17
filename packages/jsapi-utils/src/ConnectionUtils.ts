import type { dh } from '@deephaven/jsapi-types';
import { TimeoutError } from '@deephaven/utils';

/** Default timeout for fetching a variable definition */
export const FETCH_TIMEOUT = 10_000;

/**
 * Fetch the definition for a variable given a connection. Subscribes to field updates and triggers when the variable is found.
 * @param connection Connection to get the variable from
 * @param name Name of the definition to fetch
 * @param timeout Timeout for the fetch
 * @returns Promise that resolves to the variable definition if found, or rejects if there's an error or the timeout has exceeded
 */
export function fetchVariableDefinition(
  connection: dh.IdeConnection,
  name: string,
  timeout = FETCH_TIMEOUT
): Promise<dh.ide.VariableDefinition> {
  return fetchVariableDefinitionByPredicate(
    connection,
    def => def.title === name,
    timeout,
    `Variable ${name} not found`
  );
}

/**
 * Fetch the definition for a variable given a connection. Subscribes to field updates and triggers when a variable matching the predicate is found.
 * @param connection Connection to get the variable from
 * @param predicate Predicate function to test each variable definition
 * @param timeout Timeout for the fetch
 * @param errorMessage Optional error message for timeout and not found errors
 * @returns Promise that resolves to the variable definition if found, or rejects if there's an error or the timeout has exceeded
 */
export function fetchVariableDefinitionByPredicate(
  connection: dh.IdeConnection,
  predicate: (definition: dh.ide.VariableDefinition) => boolean,
  timeout = FETCH_TIMEOUT,
  errorMessage = 'Variable not found'
): Promise<dh.ide.VariableDefinition> {
  return new Promise<dh.ide.VariableDefinition>((resolve, reject) => {
    let removeListener: () => void;

    const timeoutId = setTimeout(() => {
      removeListener?.();
      reject(new TimeoutError(`Timeout: ${errorMessage}`));
    }, timeout);

    /**
     * Checks if a variable matching the predicate is in the changes, and resolves the promise if it does
     * @param changes Variables changes that have occurred
     */
    function handleFieldUpdates(changes: dh.ide.VariableChanges): void {
      const definition = changes.created.find(predicate);
      clearTimeout(timeoutId);
      removeListener?.();
      if (definition != null) {
        resolve(definition);
      } else {
        reject(new Error(errorMessage));
      }
    }

    removeListener = connection.subscribeToFieldUpdates(handleFieldUpdates);
  });
}
