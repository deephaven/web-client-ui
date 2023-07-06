import React, { useContext, useEffect, useMemo, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import { useClient } from '@deephaven/jsapi-bootstrap';
import { getErrorMessage } from '@deephaven/utils';
import { PluginsContext } from './PluginsBootstrap';
import { getAuthPluginComponent } from '../plugins';
import LoginNotifier from './LoginNotifier';

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
}: ServerConfigBootstrapProps) {
  const client = useClient();
  const [serverConfig, setServerConfig] = useState<Map<string, string>>();
  const [error, setError] = useState<unknown>();

  useEffect(
    function initServerConfigValues() {
      let isCanceled = false;
      async function loadServerConfigValues() {
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

  // TODO: Set a context here with the server config here
  return <>{children}</>;
}

export default ServerConfigBootstrap;
