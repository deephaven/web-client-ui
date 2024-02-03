import type { dh } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { ConnectionContext } from './ConnectionContext';

/**
 * Retrieve the connection for the current context.
 *
 * @returns Connection for the current context
 */
export function useConnection(): dh.IdeConnection {
  return useContextOrThrow(
    ConnectionContext,
    'No IdeConnection available in useConnection. Was code wrapped in ConnectionContext.Provider?'
  );
}

export default useConnection;
