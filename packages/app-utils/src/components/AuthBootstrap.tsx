import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AuthPluginComponent } from '@deephaven/auth-plugin';
import {
  AuthPluginAnonymous,
  AuthPluginParent,
  AuthPluginPsk,
} from '@deephaven/auth-core-plugins';
import { LoadingOverlay } from '@deephaven/components';
import { PluginsContext } from './PluginsBootstrap';
import { getAuthPluginComponent } from '../plugins';
import useClient from './useClient';

export type AuthConfigMap = Map<string, string>;

export type AuthBootstrapProps = {
  /**
   * The children to render after authentication is completed.
   */
  children: React.ReactNode;
};

/** Core auth plugins that are always loaded */
const CORE_AUTH_PLUGINS = new Map([
  ['@deephaven/auth-core-plugins.AuthPluginPsk', AuthPluginPsk],
  ['@deephaven/auth-core-plugins.AuthPluginParent', AuthPluginParent],
  ['@deephaven/auth-core-plugins.AuthPluginAnonymous', AuthPluginAnonymous],
]);

/**
 * AuthBootstrap component. Handles displaying the auth plugin and authenticating.
 */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const client = useClient();
  const plugins = useContext(PluginsContext);
  const [authConfig, setAuthConfig] = useState<AuthConfigMap>();
  const [AuthComponent, setAuthComponent] = useState<AuthPluginComponent>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<unknown>();

  useEffect(
    function initAuthConfigValues() {
      let isCancelled = false;
      async function loadAuthConfigValues() {
        try {
          const newAuthConfigValues = await client.getAuthConfigValues();
          if (!isCancelled) {
            setAuthConfig(new Map(newAuthConfigValues));
          }
        } catch (e) {
          if (!isCancelled) {
            setError(e);
          }
        }
      }
      loadAuthConfigValues();
      return () => {
        isCancelled = true;
      };
    },
    [client]
  );

  useEffect(
    function initAuthPluginComponent() {
      if (plugins == null || authConfig == null) {
        return;
      }

      const NewAuthComponent = getAuthPluginComponent(
        client,
        plugins,
        authConfig,
        CORE_AUTH_PLUGINS
      );
      setAuthComponent(() => NewAuthComponent);
    },
    [authConfig, client, plugins]
  );

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLoginFailure = useCallback((e: unknown) => {
    setIsLoggedIn(false);
    setError(e);
  }, []);

  const isLoading = AuthComponent == null || authConfig == null;
  const isLoaded = !isLoading && error == null;
  return (
    <>
      {isLoaded && !isLoggedIn && (
        <AuthComponent
          authConfigValues={authConfig}
          client={client}
          onSuccess={handleLoginSuccess}
          onFailure={handleLoginFailure}
        />
      )}
      {isLoaded && isLoggedIn && children}
      {(isLoading || error != null) && (
        <LoadingOverlay
          isLoading={isLoading}
          errorMessage={error != null ? `${error}` : undefined}
        />
      )}
    </>
  );
}

export default AuthBootstrap;
