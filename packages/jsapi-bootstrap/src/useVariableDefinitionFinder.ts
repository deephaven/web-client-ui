import { createContext, useContext } from 'react';
import type { dh } from '@deephaven/jsapi-types';

/**
 * Finds a single variable definition on a worker by predicate, resolving to the
 * first match or `null` if none is present. Lets callers locate a variable by
 * `type` (rather than a fixed name), so the variable may have any name.
 *
 * The optional `descriptor` carries routing information used to identify the
 * worker (e.g. `querySerial`/`sessionId` in DHE). Any `name`/`type` on it is
 * ignored — the predicate selects the variable. Hosts that expose a single
 * connection (DHC) may ignore the descriptor entirely.
 */
export type VariableDefinitionFinder = (
  predicate: (definition: dh.ide.VariableDefinition) => boolean,
  descriptor?: dh.ide.VariableDescriptor
) => Promise<dh.ide.VariableDefinition | null>;

/**
 * Context providing a {@link VariableDefinitionFinder}. `null` when the host
 * does not support finding variables, so consumers must handle the
 * missing-provider case.
 */
export const VariableDefinitionFinderContext =
  createContext<VariableDefinitionFinder | null>(null);

VariableDefinitionFinderContext.displayName = 'VariableDefinitionFinderContext';

/**
 * Get a function to find a worker variable by predicate, or `null` if the host
 * does not provide one. Unlike `useObjectFetcher`, this does not throw when no
 * provider is present, allowing plugins to degrade gracefully on hosts that
 * predate variable finding.
 * @returns A {@link VariableDefinitionFinder}, or `null` if unavailable
 */
export function useVariableDefinitionFinder(): VariableDefinitionFinder | null {
  return useContext(VariableDefinitionFinderContext);
}

export default useVariableDefinitionFinder;
