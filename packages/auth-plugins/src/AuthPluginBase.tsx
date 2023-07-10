import React, { useEffect, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import { useClient } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import type { LoginOptions } from '@deephaven/jsapi-types';
import { CanceledPromiseError, getErrorMessage } from '@deephaven/utils';
import AuthenticationError from './AuthenticationError';

const log = Log.module('AuthPluginBase');

export type AuthPluginBaseProps = {
  /**
   * The children to render after authentication is completed.
   */
  children: React.ReactNode;

  /**
   * Retrieve the login options for logging in to the client
   * @returns A promise for the login options
   */
  getLoginOptions: () => LoginOptions | Promise<LoginOptions>;
};

/**
 * Base AuthPlugin that gets passed a function for retrieving the login options, and then attempting to login with them.
 * @param getLoginOptions Function that returns a promise for the login options
 */
function AuthPluginBase({
  children,
  getLoginOptions,
}: AuthPluginBaseProps): JSX.Element {
  const client = useClient();
  const [error, setError] = useState<unknown>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isCanceled = false;
    function verifyNotCanceled() {
      if (isCanceled) {
        throw new CanceledPromiseError('Login canceled.');
      }
    }
    async function login() {
      try {
        const loginOptions = await getLoginOptions();
        verifyNotCanceled();

        log.info('Logging in...');
        await client.login(loginOptions);
        verifyNotCanceled();

        setIsLoggedIn(true);
      } catch (e) {
        if (!isCanceled) {
          log.error('Unable to login:', e);
          const message =
            getErrorMessage(e) ?? 'Unable to login. Verify credentials.';
          setError(new AuthenticationError(message));
          setIsLoggedIn(false);
        }
      }
    }
    login();
    return () => {
      isCanceled = true;
    };
  }, [client, getLoginOptions]);

  if (!isLoggedIn) {
    return (
      <LoadingOverlay
        data-testid="auth-base-loading"
        isLoading={error == null}
        isLoaded={false}
        errorMessage={getErrorMessage(error)}
      />
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}

export default AuthPluginBase;
