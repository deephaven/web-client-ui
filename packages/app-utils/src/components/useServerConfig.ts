import { useContextOrThrow } from '@deephaven/react-hooks';
import { ServerConfigContext } from './ServerConfigBootstrap';

export function useServerConfig(): Map<string, string> {
  return useContextOrThrow(
    ServerConfigContext,
    'No server config available in useServerConfig. Was code wrapped in ServerConfigBootstrap or ServerConfigContext.Provider?'
  );
}

export default useServerConfig;
