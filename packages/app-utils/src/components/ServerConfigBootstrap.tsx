import React, { createContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LoadingOverlay } from '@deephaven/components';
import { useClient } from '@deephaven/jsapi-bootstrap';
import { setServerConfigValues } from '@deephaven/redux';
import { getErrorMessage } from '@deephaven/utils';

export const ServerConfigContext = createContext<Map<string, string> | null>(
  null
);

export type ServerConfigBootstrapProps = {
  /**
   * The children to render after server config is loaded.
   */
  children: React.ReactNode;
};

/**
 * ServerConfigBootstrap component. Handles loading the server config.
 * Also sets the server config values in the redux store.
 */
export function ServerConfigBootstrap({
  children,
}: ServerConfigBootstrapProps): JSX.Element {
  const client = useClient();
  const [serverConfig, setServerConfig] = useState<Map<string, string>>();
  const [error, setError] = useState<unknown>();
  const dispatch = useDispatch();

  useEffect(
    function initServerConfigValues() {
      let isCanceled = false;
      async function loadServerConfigValues(): Promise<void> {
        try {
          const newServerConfigValues =
            (await client.getServerConfigValues()) as [string, string][];
          if (!isCanceled) {
            const config = new Map(newServerConfigValues);
            setServerConfig(config);
            dispatch(setServerConfigValues(config));
          }
        } catch (e) {
          if (!isCanceled) {
            setError(e);
          }
        }
      }
      loadServerConfigValues();
      return () => {
        isCanceled = true;
      };
    },
    [client, dispatch]
  );

  const isLoading = serverConfig == null;

  if (isLoading || error != null) {
    return (
      <LoadingOverlay
        isLoading={isLoading && error == null}
        errorMessage={getErrorMessage(error)}
      />
    );
  }

  return (
    <ServerConfigContext.Provider value={serverConfig}>
      {children}
    </ServerConfigContext.Provider>
  );
}

export default ServerConfigBootstrap;
