import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthConfigMap,
  AuthPluginAnonymous,
  AuthPluginParent,
  AuthPluginPsk,
} from '@deephaven/auth-plugins';
import { LoadingOverlay } from '@deephaven/components';
import { useClient } from '@deephaven/jsapi-bootstrap';
import { getErrorMessage } from '@deephaven/utils';
import { PluginsContext } from './PluginsBootstrap';
import { getAuthPluginComponent } from '../plugins';
import LoginNotifier from './LoginNotifier';

export type AuthBootstrapProps = {
  /**
   * The children to render after authentication is completed.
   */
  children: React.ReactNode;
};

/** Core auth plugins that are always loaded */
const CORE_AUTH_PLUGINS = new Map([
  ['@deephaven/auth-plugins.AuthPluginParent', AuthPluginParent],
  ['@deephaven/auth-plugins.AuthPluginPsk', AuthPluginPsk],
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
  const [error, setError] = useState<unknown>();

  useEffect(
    function initAuthConfigValues() {
      let isCanceled = false;
      async function loadAuthConfigValues() {
        try {
          const newAuthConfigValues = await client.getAuthConfigValues();
          if (!isCanceled) {
            setAuthConfig(new Map(newAuthConfigValues));
          }
        } catch (e) {
          if (!isCanceled) {
            setError(e);
          }
        }
      }
      loadAuthConfigValues();
      return () => {
        isCanceled = true;
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

  const isLoading = AuthComponent == null || authConfig == null;

  if (isLoading || error != null) {
    return (
      <LoadingOverlay
        isLoading={isLoading && error == null}
        errorMessage={getErrorMessage(error)}
      />
    );
  }
  return (
    <AuthComponent authConfigValues={authConfig}>
      <>
        <LoginNotifier />
        {children}
      </>
    </AuthComponent>
  );
}

export default AuthBootstrap;
