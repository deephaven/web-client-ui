import React, { useCallback, useEffect, useState } from 'react';
import { BasicModal } from '@deephaven/components';
import {
  ObjectFetcherContext,
  sanitizeVariableDescriptor,
  useApi,
  useClient,
} from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import type { dh as DhType } from '@deephaven/jsapi-types';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<unknown>();
  const [connection, setConnection] = useState<DhType.IdeConnection>();
  const [authFailedState, setIsAuthFailedState] = useState<boolean>(false);
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

  useEffect(() => {
    if (connection == null) return;

    // handles the shutdown event
    function handleShutdown(event: CustomEvent): void {
      const { detail } = event;
      log.info('Shutdown', `${JSON.stringify(detail)}`);
      setError(`Server shutdown: ${detail ?? 'Unknown reason'}`);
    }
    const removerFn = connection.addEventListener(
      api.IdeConnection.EVENT_SHUTDOWN,
      handleShutdown
    );

    // handles the auth failed event
    function handleAuthFailed(event: CustomEvent): void {
      const { detail } = event;
      log.warn('Reconnect authentication failed', `${JSON.stringify(detail)}`);
      setError(
        `Reconnect authentication failed: ${detail ?? 'Unknown reason'}`
      );
      setIsAuthFailedState(true);
    }
    const authFailed = connection.addEventListener(
      dh.CoreClient.EVENT_RECONNECT_AUTH_FAILED,
      handleAuthFailed
    );

    return authFailedState ? authFailed : removerFn;
  }, [api, connection, authFailedState]);

  const objectFetcher = useCallback(
    async (descriptor: DhType.ide.VariableDescriptor) => {
      assertNotNull(connection, 'No connection available to fetch object with');
      return connection.getObject(sanitizeVariableDescriptor(descriptor));
    },
    [connection]
  );

  function handleRefresh(): void {
    log.info('Refreshing application');
    window.location.reload();
  }

  return (
    <ConnectionContext.Provider value={connection ?? null}>
      <ObjectFetcherContext.Provider value={objectFetcher}>
        <>
          {children}
          <BasicModal
            confirmButtonText="Refresh"
            onConfirm={handleRefresh}
            isOpen={authFailedState}
            headerText="Authentication failed"
            bodyText="Credentials are invalid. Please refresh your browser to try and reconnect."
          />
        </>
      </ObjectFetcherContext.Provider>
    </ConnectionContext.Provider>
  );
}

export default ConnectionBootstrap;
