import React, { createContext } from 'react';
import { ConnectOptions, CoreClient } from '@deephaven/jsapi-types';
import useCreateClient from './useCreateClient';

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
  const client = useCreateClient(serverUrl, options);
  return (
    <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  );
}

export default ClientBootstrap;
