import React, { useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { AuthPlugin, AuthPluginProps } from '@deephaven/auth-plugin';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';

const log = Log.module('AuthPluginAnonymous');

const AUTH_TYPE = 'io.deephaven.auth.AnonymousAuthenticationHandler';

/**
 * AuthPlugin that tries to login anonymously. Fails if anonymous login fails
 */
export function Component({
  client,
  onSuccess,
  onFailure,
}: AuthPluginProps): JSX.Element {
  const [error, setError] = useState<unknown>();
  const dh = useApi();

  useEffect(() => {
    async function login() {
      try {
        log.info('Logging in...');
        await client.login({ type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS });
        log.info('Logged in successfully.');
        onSuccess();
      } catch (e) {
        log.error('Unable to login:', e);
        setError(e);
        onFailure(e);
      }
    }
    login();
  }, [client, dh, onFailure, onSuccess]);
  return (
    <LoadingOverlay
      isLoading
      isLoaded={false}
      errorMessage={error != null ? `${error}` : null}
    />
  );
}

export const AuthPluginAnonymous: AuthPlugin = {
  Component,
  isAvailable: (client, authHandlers, authConfigValues) =>
    authHandlers.includes(AUTH_TYPE),
};

export default AuthPluginAnonymous;
