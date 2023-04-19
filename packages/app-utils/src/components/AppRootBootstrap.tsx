import React from 'react';
import { getBaseUrl, getConnectOptions, getWebsocketUrl } from '../utils';
import AuthBootstrap from './AuthBootstrap';
import ClientBootstrap from './ClientBootstrap';
import ConnectionBootstrap from './ConnectionBootstrap';
import PluginsBootstrap from './PluginsBootstrap';

export type AppRootBootstrapProps = {
  /** Base URL of the app. */
  baseUrl: string;

  /** URL of the API to load. */
  apiUrl: string;

  /** URL of the plugins to load. */
  pluginsUrl: string;

  /**
   * The children to render after authentication is completed.
   */
  children: React.ReactNode;
};

/**
 * PluginsBootstrap component. Handles loading the plugins.
 */
export function AppRootBootstrap({
  apiUrl,
  baseUrl,
  pluginsUrl,
  children,
}: AppRootBootstrapProps) {
  const websocketUrl = getWebsocketUrl(getBaseUrl(apiUrl));
  const clientOptions = getConnectOptions();

  return (
    <ClientBootstrap websocketUrl={websocketUrl} options={clientOptions}>
      <PluginsBootstrap pluginsUrl={pluginsUrl}>
        <AuthBootstrap>
          <ConnectionBootstrap>{children}</ConnectionBootstrap>
        </AuthBootstrap>
      </PluginsBootstrap>
    </ClientBootstrap>
  );
}

export default AppRootBootstrap;
