import React, { useCallback, useEffect, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import {
  ObjectFetcherContext,
  sanitizeVariableDescriptor,
  useApi,
  useClient,
} from '@deephaven/jsapi-bootstrap';
import type { IdeConnection, VariableDescriptor } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import ConnectionContext from './ConnectionContext';

const log = Log.module('@deephaven/app-utils.ConnectionBootstrap');

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
export function ConnectionBootstrap({
  children,
}: ConnectionBootstrapProps): JSX.Element {
  const api = useApi();
  const client = useClient();
  const [error, setError] = useState<unknown>();
  const [connection, setConnection] = useState<IdeConnection>();
  useEffect(
    function initConnection() {
      let isCanceled = false;
      async function loadConnection(): Promise<void> {
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

      function handleShutdown(event: CustomEvent): void {
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

  const objectFetcher = useCallback(
    async (descriptor: VariableDescriptor) => {
      assertNotNull(connection, 'No connection available to fetch object with');
      return connection.getObject(sanitizeVariableDescriptor(descriptor));
    },
    [connection]
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
      <ObjectFetcherContext.Provider value={objectFetcher}>
        {children}
      </ObjectFetcherContext.Provider>
    </ConnectionContext.Provider>
  );
}

export default ConnectionBootstrap;
