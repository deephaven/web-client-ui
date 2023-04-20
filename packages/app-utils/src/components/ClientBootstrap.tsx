import React, { createContext, useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { ConnectOptions, CoreClient } from '@deephaven/jsapi-types';

export const ClientContext = createContext<CoreClient | null>(null);

export type ClientBootstrapProps = {
  /** URL of the server to connect to */
  serverUrl: string;

  /** Connection options to pass to CoreClient when connecting */
  options?: ConnectOptions;

  /**
   * The children to render wrapped with the ClientContext.
   * Will not render children until the client is created.
   */
  children: React.ReactNode;
};

/**
 * ClientBootstrap component. Handles creating the client.
 */
export function ClientBootstrap({
  serverUrl,
  options,
  children,
}: ClientBootstrapProps) {
  const api = useApi();
  const [client, setClient] = useState<CoreClient>();
  useEffect(
    function initClient() {
      const newClient = new api.CoreClient(serverUrl, options);
      setClient(newClient);
      return () => {
        newClient.disconnect();
      };
    },
    [api, options, serverUrl]
  );

  if (client == null) {
    return null;
  }
  return (
    <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  );
}

export default ClientBootstrap;
