import type { CoreClient } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { ClientContext } from './ClientBootstrap';

export function useClient(): CoreClient {
  return useContextOrThrow(
    ClientContext,
    'No Client available in useClient. Was code wrapped in ClientBootstrap or ClientContext.Provider?'
  );
}

export default useClient;
