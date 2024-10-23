import React, { useCallback, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '@deephaven/redux';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { ClientBootstrap } from '@deephaven/jsapi-bootstrap';
import { useBroadcastLoginListener } from '@deephaven/jsapi-components';
import { type Plugin } from '@deephaven/plugin';
import FontBootstrap from './FontBootstrap';
import PluginsBootstrap from './PluginsBootstrap';
import AuthBootstrap from './AuthBootstrap';
import ConnectionBootstrap from './ConnectionBootstrap';
import { getConnectOptions } from '../utils';
import FontsLoaded from './FontsLoaded';
import UserBootstrap from './UserBootstrap';
import ServerConfigBootstrap from './ServerConfigBootstrap';
import ThemeBootstrap from './ThemeBootstrap';

export type AppBootstrapProps = {
  /** URL of the server. */
  serverUrl: string;

  /** URL of the plugins to load. */
  pluginsUrl: string;

  /** The core plugins to load. */
  getCorePlugins?: () => Promise<Plugin[]>;

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
  getCorePlugins,
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
    <Provider store={store}>
      <FontBootstrap fontClassNames={fontClassNames}>
        <PluginsBootstrap
          getCorePlugins={getCorePlugins}
          pluginsUrl={pluginsUrl}
        >
          <ThemeBootstrap>
            <ClientBootstrap
              serverUrl={serverUrl}
              options={clientOptions}
              key={logoutCount}
            >
              <AuthBootstrap>
                <ServerConfigBootstrap>
                  <UserBootstrap>
                    <ConnectionBootstrap>
                      <FontsLoaded>{children}</FontsLoaded>
                    </ConnectionBootstrap>
                  </UserBootstrap>
                </ServerConfigBootstrap>
              </AuthBootstrap>
            </ClientBootstrap>
          </ThemeBootstrap>
        </PluginsBootstrap>
      </FontBootstrap>
    </Provider>
  );
}

export default AppBootstrap;
