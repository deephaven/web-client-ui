import React, { createContext, useEffect, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import { useApi, useClient } from '@deephaven/jsapi-bootstrap';
import type { IdeConnection } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/jsapi-components.ConnectionBootstrap');

export const ConnectionContext = createContext<IdeConnection | null>(null);

export type ConnectionBootstrapProps = {
  /**
   * The children to render wrapped with the ConnectionContext.
   * Will not render children until the connection is created.
   */
  children: React.ReactNode;
};

/**
 * ConnectionBootstrap component. Handles initializing the connection.
 */
export function ConnectionBootstrap({ children }: ConnectionBootstrapProps) {
  const api = useApi();
  const client = useClient();
  const [error, setError] = useState<unknown>();
  const [connection, setConnection] = useState<IdeConnection>();
  useEffect(
    function initConnection() {
      let isCanceled = false;
      async function loadConnection() {
        try {
          const newConnection = await client.getAsIdeConnection();
          if (isCanceled) {
            return;
          }
          setConnection(newConnection);
        } catch (e) {
          if (isCanceled) {
            return;
          }
          setError(e);
        }
      }
      loadConnection();
      return () => {
        isCanceled = true;
      };
    },
    [api, client]
  );

  useEffect(
    function listenForShutdown() {
      if (connection == null) return;

      function handleShutdown(event: CustomEvent) {
        const { detail } = event;
        log.info('Shutdown', `${JSON.stringify(detail)}`);
        setError(`Server shutdown: ${detail ?? 'Unknown reason'}`);
      }

      const removerFn = connection.addEventListener(
        api.IdeConnection.EVENT_SHUTDOWN,
        handleShutdown
      );
      return removerFn;
    },
    [api, connection]
  );

  if (connection == null || error != null) {
    return (
      <LoadingOverlay
        data-testid="connection-bootstrap-loading"
        isLoading={connection == null}
        errorMessage={error != null ? `${error}` : undefined}
      />
    );
  }

  return (
    <ConnectionContext.Provider value={connection}>
      {children}
    </ConnectionContext.Provider>
  );
}

export default ConnectionBootstrap;
