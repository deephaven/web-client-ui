import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { LoadingOverlay, ThemeExport } from '@deephaven/components';
import { useClient } from '@deephaven/jsapi-bootstrap';
import { useBroadcastLoginListener } from '@deephaven/jsapi-components';
import Log from '@deephaven/log';
import { getErrorMessage } from '@deephaven/utils';
import Cookies from 'js-cookie';
import { AuthPlugin, AuthPluginProps } from './AuthPlugin';
import LoginForm from './LoginForm';
import Login from './Login';
import AuthenticationError from './AuthenticationError';

const AUTH_TYPE = 'io.deephaven.authentication.psk.PskAuthenticationHandler';

const PSK_QUERY_PARAM_KEY = 'psk';

const PSK_TOKEN_KEY = 'io.deephaven.web.client.auth.psk.token';

const log = Log.module('AuthPluginPsk');

function getWindowToken(): string | null {
  return new URLSearchParams(window.location.search).get(PSK_QUERY_PARAM_KEY);
}

function clearWindowToken(): void {
  log.debug2('clearWindowToken');
  const url = new URL(window.location.href);
  url.searchParams.delete(PSK_QUERY_PARAM_KEY);

  window.history.replaceState(null, '', url.href);
}

function readCookieToken(): string | null {
  return Cookies.get(PSK_TOKEN_KEY) ?? null;
}

function storeCookieToken(token: string | null): void {
  log.debug2('Storing token in cookie', token);
  if (token != null) {
    Cookies.set(PSK_TOKEN_KEY, token, { secure: true, sameSite: 'strict' });
  } else {
    Cookies.remove(PSK_TOKEN_KEY);
  }
}

export type AuthPluginPskProps = AuthPluginProps & {
  /** Custom path to a logo to display on the login screen */
  logoPath?: string;
};

/**
 * AuthPlugin that tries to login using a pre-shared key.
 * Add the `psk=<token>` parameter to your URL string to set the token.
 */
function Component({ children, logoPath }: AuthPluginPskProps): JSX.Element {
  const client = useClient();
  const inputField = useRef<HTMLInputElement>(null);
  const loginPromise = useRef<Promise<void> | null>(null);
  const [error, setError] = useState<unknown>();
  const [isInputRequired, setIsInputRequired] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [token, setToken] = useState('');

  const login = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    async (loginToken: string, showError: boolean = true) => {
      log.info('Logging in...');
      setIsLoggingIn(true);
      let newLoginPromise: Promise<void> | null = null;
      try {
        newLoginPromise = client.login({ type: AUTH_TYPE, token: loginToken });
        loginPromise.current = newLoginPromise;
        await newLoginPromise;

        log.info('Logged in successfully');
        if (loginPromise.current !== newLoginPromise) {
          return;
        }
        storeCookieToken(loginToken);
        setIsLoggedIn(true);
      } catch (e) {
        if (loginPromise.current !== newLoginPromise) {
          return;
        }
        setIsInputRequired(true);
        if (showError) {
          log.error('Unable to login', e);
          const message =
            getErrorMessage(e) ?? 'Unable to login: Verify credentials.';
          setError(new AuthenticationError(message));
        }
      }
      setIsLoggingIn(false);
    },
    [client]
  );

  const cancelLogin = useCallback(() => {
    loginPromise.current = null;
    setIsLoggingIn(false);
  }, []);

  const onLogin = useCallback(async () => {
    log.debug('onLogin');

    // User logged in successfully in another tab, we should be able to read the token from the cookie and login
    const newToken = readCookieToken();
    if (isLoggedIn || isLoggingIn || newToken == null) {
      return;
    }

    login(newToken, false);
  }, [isLoggedIn, isLoggingIn, login]);
  const onLogout = useCallback(() => {
    storeCookieToken(null);
  }, []);
  useBroadcastLoginListener(onLogin, onLogout);

  useEffect(() => {
    let isCanceled = false;
    async function initialLogin(): Promise<void> {
      const initialToken = getWindowToken() ?? readCookieToken();
      clearWindowToken();

      if (initialToken == null) {
        setIsInputRequired(true);
        return;
      }

      setIsLoggingIn(true);
      try {
        await client.login({ type: AUTH_TYPE, token: initialToken });
        if (!isCanceled) {
          storeCookieToken(initialToken);
          setIsLoggedIn(true);
          setIsLoggingIn(false);
        }
      } catch (e) {
        if (!isCanceled) {
          setIsInputRequired(true);
          setIsLoggingIn(false);
        }
      }
    }
    initialLogin();
    return () => {
      isCanceled = true;
    };
  }, [client]);

  const handleSubmit = useCallback(() => {
    if (!isLoggingIn) {
      login(token);
    } else {
      cancelLogin();
    }
  }, [cancelLogin, isLoggingIn, login, token]);

  useEffect(
    function autoFocusInput() {
      inputField.current?.focus();
    },
    [inputField, isInputRequired]
  );

  return (
    <>
      {isLoggedIn && children}
      {isInputRequired && (
        <CSSTransition
          in={!isLoggedIn}
          timeout={ThemeExport.transitionMs}
          classNames="fade"
          mountOnEnter
          unmountOnExit
        >
          <Login logoPath={logoPath}>
            <LoginForm
              errorMessage={getErrorMessage(error)}
              isLoggingIn={isLoggingIn}
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="auth-psk-token-input">Token</label>
                <input
                  id="auth-psk-token-input"
                  name="token"
                  className="input-token form-control"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  ref={inputField}
                  value={token}
                  onChange={event => {
                    setError(undefined);
                    setToken(event.target.value);
                  }}
                />
              </div>
            </LoginForm>
          </Login>
        </CSSTransition>
      )}
      <LoadingOverlay
        data-testid="auth-psk-loading"
        isLoaded={isLoggedIn || isInputRequired}
        isLoading={!isLoggedIn && !isInputRequired}
      />
    </>
  );
}

const AuthPluginPsk: AuthPlugin = {
  Component,
  isAvailable: authHandlers => authHandlers.includes(AUTH_TYPE),
};

export default AuthPluginPsk;
