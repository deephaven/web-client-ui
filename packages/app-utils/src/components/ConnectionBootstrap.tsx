import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BasicModal,
  DebouncedModal,
  InfoModal,
  LoadingOverlay,
  LoadingSpinner,
} from '@deephaven/components';
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
import { vsDebugDisconnect } from '@deephaven/icons';
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
  const [connection, setConnection] = useState<dh.IdeConnection>();
  const [isAuthFailed, setIsAuthFailed] = useState<boolean>(false);
  const [isShutdown, setIsShutdown] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

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
    function listenForDisconnect() {
      if (connection == null || isShutdown) return;

      // handles the disconnect event
      function handleDisconnect(event: CustomEvent): void {
        const { detail } = event;
        log.info('Disconnect', `${JSON.stringify(detail)}`);
        setIsReconnecting(true);
      }
      const removerFn = connection.addEventListener(
        api.IdeConnection.EVENT_DISCONNECT,
        handleDisconnect
      );

      return removerFn;
    },
    [api, connection, isShutdown]
  );

  useEffect(
    function listenForReconnect() {
      if (connection == null || isShutdown) return;

      // handles the reconnect event
      function handleReconnect(event: CustomEvent): void {
        const { detail } = event;
        log.info('Reconnect', `${JSON.stringify(detail)}`);
        setIsReconnecting(false);
      }
      const removerFn = connection.addEventListener(
        api.CoreClient.EVENT_RECONNECT,
        handleReconnect
      );

      return removerFn;
    },
    [api, connection, isShutdown]
  );

  useEffect(
    function listenForShutdown() {
      if (connection == null) return;

      // handles the shutdown event
      function handleShutdown(event: CustomEvent): void {
        const { detail } = event;
        log.info('Shutdown', `${JSON.stringify(detail)}`);
        setError(`Server shutdown: ${detail ?? 'Unknown reason'}`);
        setIsShutdown(true);
        setIsReconnecting(false);
        setIsAuthFailed(false);
      }
      const removerFn = connection.addEventListener(
        api.IdeConnection.EVENT_SHUTDOWN,
        handleShutdown
      );

      return removerFn;
    },
    [api, connection]
  );

  useEffect(
    function listenForAuthFailed() {
      if (connection == null || isShutdown) return;

      // handles the auth failed event
      function handleAuthFailed(event: CustomEvent): void {
        const { detail } = event;
        log.warn(
          'Reconnect authentication failed',
          `${JSON.stringify(detail)}`
        );
        setError(
          `Reconnect authentication failed: ${detail ?? 'Unknown reason'}`
        );
        setIsAuthFailed(true);
        setIsReconnecting(false);
      }
      const removerFn = connection.addEventListener(
        api.CoreClient.EVENT_RECONNECT_AUTH_FAILED,
        handleAuthFailed
      );

      return removerFn;
    },
    [api, connection, isShutdown]
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

  function handleRefresh(): void {
    log.info('Refreshing application');
    window.location.reload();
  }

  return (
    <ConnectionContext.Provider value={connection ?? null}>
      <ObjectFetcherContext.Provider value={objectFetcher}>
        <ObjectFetchManagerContext.Provider value={objectManager}>
          {(() => {
            if (isShutdown) {
              return (
                <LoadingOverlay
                  isLoading={false}
                  errorMessage={error != null ? `${error}` : undefined}
                />
              );
            }
            if (isReconnecting) {
              return (
                <>
                  {children}
                  <DebouncedModal isOpen={isReconnecting} debounceMs={1000}>
                    <InfoModal
                      icon={vsDebugDisconnect}
                      title={
                        <>
                          <LoadingSpinner /> Attempting to reconnect...
                        </>
                      }
                      subtitle="Please check your network connection."
                    />
                  </DebouncedModal>
                </>
              );
            }
            if (isAuthFailed) {
              return (
                <>
                  {children}
                  <BasicModal
                    confirmButtonText="Refresh"
                    onConfirm={handleRefresh}
                    isOpen={isAuthFailed}
                    headerText="Authentication failed"
                    bodyText="Credentials are invalid. Please refresh your browser to try and reconnect."
                  />
                </>
              );
            }
            // If none of the conditions are met, render the children
            return children;
          })()}
        </ObjectFetchManagerContext.Provider>
      </ObjectFetcherContext.Provider>
    </ConnectionContext.Provider>
  );
}

export default ConnectionBootstrap;
