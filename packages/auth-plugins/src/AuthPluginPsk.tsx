import React, { useEffect, useState } from 'react';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { AuthPlugin, AuthPluginProps } from './AuthPlugin';

const log = Log.module('AuthPluginPsk');

const AUTH_TYPE = 'io.deephaven.authentication.psk.PskAuthenticationHandler';

function getWindowToken(): string {
  return new URLSearchParams(window.location.search).get('psk') ?? '';
}

/**
 * AuthPlugin that tries to login using a pre-shared key.
 * Add the `psk=<token>` parameter to your URL string to set the token.
 */
function Component({
  client,
  onSuccess,
  onFailure,
}: AuthPluginProps): JSX.Element {
  const [error, setError] = useState<unknown>();
  const [token] = useState(() => getWindowToken());
  useEffect(() => {
    let isCanceled = false;
    async function login() {
      try {
        if (!token) {
          throw new Error(
            'No Pre-shared key token found. Add `psk=<token>` parameter to your URL'
          );
        }
        log.info('Logging in with found token...');
        await client.login({ type: AUTH_TYPE, token });
        if (isCanceled) {
          log.info('Previous login result canceled');
          return;
        }
        log.info('Logged in successfully.');
        onSuccess();
      } catch (e) {
        if (isCanceled) {
          log.info('Previous login failure canceled');
          return;
        }
        log.error('Unable to login:', e);
        setError(e);
        onFailure(e);
      }
    }
    login();
    return () => {
      isCanceled = true;
    };
  }, [client, onFailure, onSuccess, token]);
  return (
    <LoadingOverlay
      data-testid="auth-psk-loading"
      isLoading
      isLoaded={false}
      errorMessage={error != null ? `${error}` : null}
    />
  );
}

const AuthPluginPsk: AuthPlugin = {
  Component,
  isAvailable: authHandlers => authHandlers.includes(AUTH_TYPE),
};

export default AuthPluginPsk;
