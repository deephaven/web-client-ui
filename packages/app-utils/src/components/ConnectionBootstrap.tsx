import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import {
  ObjectFetcherContext,
  ObjectFetchManager,
  ObjectFetchManagerContext,
  sanitizeVariableDescriptor,
  useApi,
  useClient,
} from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';
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
  const [connection, setConnection] = useState<dh.IdeConnection>();

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
    async (descriptor: dh.ide.VariableDescriptor) => {
      assertNotNull(connection, 'No connection available to fetch object with');
      return connection.getObject(sanitizeVariableDescriptor(descriptor));
    },
    [connection]
  );

  /** We don't really need to do anything fancy in Core to manage an object, just fetch it  */
  const objectManager: ObjectFetchManager = useMemo(
    () => ({
      subscribe: (descriptor, onUpdate) => {
        // We send an update with the fetch right away
        onUpdate({
          fetch: () => objectFetcher(descriptor),
          status: 'ready',
        });
        return () => {
          // no-op
          // For Core, if the server dies then we can't reconnect anyway, so no need to bother listening for subscription or cleaning up
        };
      },
    }),
    [objectFetcher]
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
        <ObjectFetchManagerContext.Provider value={objectManager}>
          {children}
        </ObjectFetchManagerContext.Provider>
      </ObjectFetcherContext.Provider>
    </ConnectionContext.Provider>
  );
}

export default ConnectionBootstrap;
