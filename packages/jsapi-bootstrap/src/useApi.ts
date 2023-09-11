import type { dh as DhType } from '@deephaven/jsapi-types';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { ApiContext } from './ApiBootstrap';

export function useApi(): DhType {
  return useContextOrThrow(
    ApiContext,
    'No API available in useApi. Was code wrapped in ApiBootstrap or ApiContext.Provider?'
  );
}

export default useApi;
