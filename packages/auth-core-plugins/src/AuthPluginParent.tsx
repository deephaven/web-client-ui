import React, { useEffect, useState } from 'react';
import { LoginOptions } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { AuthPlugin, AuthPluginProps } from '@deephaven/auth-plugin';

const log = Log.module('AuthPluginParent');

function getWindowAuthProvider(): string {
  return new URLSearchParams(window.location.search).get('authProvider') ?? '';
}

/**
 * AuthPlugin that tries to delegate to the parent window for authentication. Fails if there is no parent window.
 */
function Component({
  client,
  onSuccess,
  onFailure,
}: AuthPluginProps): JSX.Element {
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    async function login() {
      try {
        if (window.opener == null) {
          throw new Error(
            'window.opener is null, unable to send auth request.'
          );
        }
        log.info('Logging in by delegating to parent window...');
        const loginOptions = await new Promise<LoginOptions>(resolve => {
          const listener = (
            event: MessageEvent<{
              message: string;
              payload: LoginOptions;
            }>
          ) => {
            const { data } = event;
            log.debug('Received message', data);
            if (data?.message !== 'loginOptions') {
              log.debug('Ignore received message', data);
              return;
            }
            window.removeEventListener('message', listener);
            resolve(data.payload);
          };
          window.addEventListener('message', listener);
          window.opener.postMessage('requestLoginOptionsFromParent', '*');
        });

        await client.login(loginOptions);
        log.info('Logged in successfully.');
        onSuccess();
      } catch (e) {
        log.error('Unable to login:', e);
        setError(e);
        onFailure(e);
      }
    }
    login();
  }, [client, onFailure, onSuccess]);
  return (
    <LoadingOverlay
      data-testid="auth-parent-loading"
      isLoading
      isLoaded={false}
      errorMessage={error != null ? `${error}` : null}
    />
  );
}

const AuthPluginParent: AuthPlugin = {
  Component,
  isAvailable: () =>
    window.opener != null && getWindowAuthProvider() === 'parent',
};

export default AuthPluginParent;
