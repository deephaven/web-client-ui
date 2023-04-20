import React from 'react';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import FontBootstrap from './FontBootstrap';
import ClientBootstrap from './ClientBootstrap';
import PluginsBootstrap from './PluginsBootstrap';
import AuthBootstrap from './AuthBootstrap';
import ConnectionBootstrap from './ConnectionBootstrap';
import { getBaseUrl, getConnectOptions } from '../utils';
import FontsLoaded from './FontsLoaded';

export type AppBootstrapProps = {
  /** URL of the API to load. */
  apiUrl: string;

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
  apiUrl,
  fontClassNames,
  pluginsUrl,
  children,
}: AppBootstrapProps) {
  const serverUrl = getBaseUrl(apiUrl).origin;
  const clientOptions = getConnectOptions();
  return (
    <FontBootstrap fontClassNames={fontClassNames}>
      <ClientBootstrap serverUrl={serverUrl} options={clientOptions}>
        <PluginsBootstrap pluginsUrl={pluginsUrl}>
          <AuthBootstrap>
            <ConnectionBootstrap>
              <FontsLoaded>{children}</FontsLoaded>
            </ConnectionBootstrap>
          </AuthBootstrap>
        </PluginsBootstrap>
      </ClientBootstrap>
    </FontBootstrap>
  );
}

export default AppBootstrap;
