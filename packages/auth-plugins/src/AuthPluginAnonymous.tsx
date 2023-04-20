import React, { useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { AUTH_HANDLER_TYPE_ANONYMOUS } from './AuthHandlerTypes';
import { AuthPlugin, AuthPluginProps } from './AuthPlugin';

const log = Log.module('AuthPluginAnonymous');

/**
 * AuthPlugin that tries to login anonymously. Fails if anonymous login fails
 */
function Component({
  client,
  onSuccess,
  onFailure,
}: AuthPluginProps): JSX.Element {
  const [error, setError] = useState<unknown>();
  const dh = useApi();

  useEffect(() => {
    let isCanceled = false;
    async function login() {
      try {
        log.info('Logging in...');
        await client.login({ type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS });
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
  }, [client, dh, onFailure, onSuccess]);
  return (
    <LoadingOverlay
      data-testid="auth-anonymous-loading"
      isLoading
      isLoaded={false}
      errorMessage={error != null ? `${error}` : null}
    />
  );
}

const AuthPluginAnonymous: AuthPlugin = {
  Component,
  isAvailable: authHandlers =>
    authHandlers.includes(AUTH_HANDLER_TYPE_ANONYMOUS),
};

export default AuthPluginAnonymous;
