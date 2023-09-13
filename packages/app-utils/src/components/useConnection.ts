import type { IdeConnection } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { ConnectionContext } from './ConnectionBootstrap';

export function useConnection(): IdeConnection {
  return useContextOrThrow(
    ConnectionContext,
    'No IdeConnection available in useConnection. Was code wrapped in ConnectionBootstrap or ConnectionContext.Provider?'
  );
}

export default useConnection;
