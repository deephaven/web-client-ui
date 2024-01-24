import type { dh.ConnectOptions, dh.CoreClient } from '@deephaven/jsapi-types';
import { useEffect, useMemo } from 'react';
import useApi from './useApi';

export function useCreateClient(
  serverUrl: string,
  options?: dh.ConnectOptions
): dh.CoreClient {
  const api = useApi();
  const client = useMemo(
    () => new api.CoreClient(serverUrl, options),
    [api, serverUrl, options]
  );
  useEffect(
    () => () => {
      client.disconnect();
    },
    [client]
  );
  return client;
}

export default useCreateClient;
