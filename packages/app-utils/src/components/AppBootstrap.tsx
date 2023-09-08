import React, { useCallback, useMemo, useState } from 'react';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { ClientBootstrap } from '@deephaven/jsapi-bootstrap';
import {
  RefreshTokenBootstrap,
  useBroadcastLoginListener,
} from '@deephaven/jsapi-components';
import FontBootstrap from './FontBootstrap';
import PluginsBootstrap from './PluginsBootstrap';
import AuthBootstrap from './AuthBootstrap';
import ConnectionBootstrap from './ConnectionBootstrap';
import { getConnectOptions } from '../utils';
import FontsLoaded from './FontsLoaded';
import UserBootstrap from './UserBootstrap';
import ServerConfigBootstrap from './ServerConfigBootstrap';

export type AppBootstrapProps = {
  /** URL of the server. */
  serverUrl: string;

  /** URL of the plugins to load. */
  pluginsUrl: string;

  /** Font class names to load. */
  fontClassNames?: string[];

  /**
   * The children to render wrapped when everything is loaded and authenticated.
   */
  children: React.ReactNode;
};

/**
 * AppBootstrap component. Handles loading the fonts, client, and authentication.
 * Will display the children when everything is loaded and authenticated.
 */
export function AppBootstrap({
  fontClassNames,
  pluginsUrl,
  serverUrl,
  children,
}: AppBootstrapProps): JSX.Element {
  const clientOptions = useMemo(() => getConnectOptions(), []);

  // On logout, we reset the client and have user login again
  const [logoutCount, setLogoutCount] = useState(0);
  const onLogin = useCallback(() => undefined, []);
  const onLogout = useCallback(() => {
    setLogoutCount(value => value + 1);
  }, []);
  useBroadcastLoginListener(onLogin, onLogout);
  return (
    <FontBootstrap fontClassNames={fontClassNames}>
      <PluginsBootstrap pluginsUrl={pluginsUrl}>
        <ClientBootstrap
          serverUrl={serverUrl}
          options={clientOptions}
          key={logoutCount}
        >
          <RefreshTokenBootstrap>
            <AuthBootstrap>
              <ServerConfigBootstrap>
                <UserBootstrap>
                  <ConnectionBootstrap>
                    <FontsLoaded>{children}</FontsLoaded>
                  </ConnectionBootstrap>
                </UserBootstrap>
              </ServerConfigBootstrap>
            </AuthBootstrap>
          </RefreshTokenBootstrap>
        </ClientBootstrap>
      </PluginsBootstrap>
    </FontBootstrap>
  );
}

export default AppBootstrap;
