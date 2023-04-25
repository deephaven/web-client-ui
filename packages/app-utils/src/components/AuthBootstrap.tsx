import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AuthConfigMap,
  AuthPluginAnonymous,
  AuthPluginParent,
  AuthPluginPsk,
} from '@deephaven/auth-plugins';
import { LoadingOverlay } from '@deephaven/components';
import { PluginsContext } from './PluginsBootstrap';
import { getAuthPluginComponent } from '../plugins';
import useClient from './useClient';

export type AuthBootstrapProps = {
  /**
   * The children to render after authentication is completed.
   */
  children: React.ReactNode;
};

/** Core auth plugins that are always loaded */
const CORE_AUTH_PLUGINS = new Map([
  ['@deephaven/auth-plugins.AuthPluginPsk', AuthPluginPsk],
  ['@deephaven/auth-plugins.AuthPluginParent', AuthPluginParent],
  ['@deephaven/auth-plugins.AuthPluginAnonymous', AuthPluginAnonymous],
]);

/**
 * AuthBootstrap component. Handles displaying the auth plugin and authenticating.
 */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const client = useClient();
  // `useContext` instead of `usePlugins` so that we don't have to wait for the plugins to load
  // We want to load the auth config values in parallel with the plugins
  const plugins = useContext(PluginsContext);
  const [authConfig, setAuthConfig] = useState<AuthConfigMap>();
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

  const AuthComponent = useMemo(() => {
    if (plugins == null || authConfig == null) {
      return undefined;
    }

    try {
      return getAuthPluginComponent(plugins, authConfig, CORE_AUTH_PLUGINS);
    } catch (e) {
      setError(e);
    }
  }, [authConfig, plugins]);

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLoginFailure = useCallback((e: unknown) => {
    setIsLoggedIn(false);
    setError(e);
  }, []);

  const isLoading = AuthComponent == null || authConfig == null;

  if (isLoading || error != null) {
    return (
      <LoadingOverlay
        isLoading={isLoading}
        errorMessage={error != null ? `${error}` : undefined}
      />
    );
  }
  if (!isLoggedIn) {
    return (
      <AuthComponent
        authConfigValues={authConfig}
        client={client}
        onSuccess={handleLoginSuccess}
        onFailure={handleLoginFailure}
      />
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default AuthBootstrap;
