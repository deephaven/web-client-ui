import React, { useEffect, useState } from 'react';
import { LoginOptions } from '@deephaven/jsapi-types';
import {
  LOGIN_OPTIONS_REQUEST,
  requestParentResponse,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { LoadingOverlay } from '@deephaven/components';
import { AuthPlugin, AuthPluginProps } from './AuthPlugin';

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
        log.info('Logging in by delegating to parent window...');
        const loginOptions = await requestParentResponse<LoginOptions>(
          LOGIN_OPTIONS_REQUEST
        );

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
