import React, { createContext, useEffect, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import { useClient } from '@deephaven/jsapi-bootstrap';
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
 */
export function ServerConfigBootstrap({
  children,
}: ServerConfigBootstrapProps): JSX.Element {
  const client = useClient();
  const [serverConfig, setServerConfig] = useState<Map<string, string>>();
  const [error, setError] = useState<unknown>();

  useEffect(
    function initServerConfigValues() {
      let isCanceled = false;
      async function loadServerConfigValues(): Promise<void> {
        try {
          const newServerConfigValues = await client.getServerConfigValues();
          if (!isCanceled) {
            setServerConfig(new Map(newServerConfigValues));
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
    [client]
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
