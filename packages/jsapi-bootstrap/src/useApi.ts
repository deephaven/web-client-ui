import { useContextOrThrow } from '@deephaven/react-hooks';
import { ApiContext } from './ApiBootstrap';

export function useApi() {
  return useContextOrThrow(
    ApiContext,
    'No API available in useApi. Was code wrapped in ApiBootstrap or ApiContext.Provider?'
  );
}

export default useApi;
