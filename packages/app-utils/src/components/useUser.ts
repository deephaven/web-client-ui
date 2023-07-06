import { useContextOrThrow } from '@deephaven/react-hooks';
import { UserContext } from '@deephaven/auth-plugins';

export function useUser() {
  return useContextOrThrow(
    UserContext,
    'No server config available in useServerConfig. Was code wrapped in ServerConfigBootstrap or ServerConfigContext.Provider?'
  );
}

export default useUser;
