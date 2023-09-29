import React, { useCallback, useEffect, useState } from 'react';
import { useApi, useClient } from '@deephaven/jsapi-bootstrap';
import useBroadcastLoginListener from './useBroadcastLoginListener';
import {
  readRefreshToken,
  RefreshTokenContext,
  storeRefreshToken,
} from './RefreshTokenUtils';

export type RefreshTokenBootstrapProps = {
  /**
   * The children to render wrapped with the RefreshTokenContext.
   */
  children: React.ReactNode;
};

/**
 * RefreshTokenBootstrap component. Handles storing and reading the refresh token.
 */
export function RefreshTokenBootstrap({
  children,
}: RefreshTokenBootstrapProps): JSX.Element {
  const api = useApi();
  const client = useClient();
  const [token, setToken] = useState(readRefreshToken());

  useEffect(
    function listenForTokenUpdates() {
      const cleanup = client.addEventListener(
        api.CoreClient.EVENT_REFRESH_TOKEN_UPDATED,
        (event: CustomEvent) => {
          const { detail: newToken } = event;
          storeRefreshToken(newToken);
          setToken(newToken);
        }
      );
      return cleanup;
    },
    [api, client, token]
  );

  const onLogin = useCallback(() => {
    setToken(readRefreshToken());
  }, []);

  const onLogout = useCallback(() => {
    storeRefreshToken(null);
    setToken(null);
  }, []);

  useBroadcastLoginListener(onLogin, onLogout);

  return (
    <RefreshTokenContext.Provider value={token}>
      {children}
    </RefreshTokenContext.Provider>
  );
}

export default RefreshTokenBootstrap;
