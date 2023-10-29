import type { IdeConnection } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { ConnectionContext } from './ConnectionContext';

export function useConnection(): IdeConnection {
  return useContextOrThrow(
    ConnectionContext,
    'No IdeConnection available in useConnection. Was code wrapped in ConnectionContext.Provider?'
  );
}

export default useConnection;
