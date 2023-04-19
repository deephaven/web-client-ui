import React from 'react';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import FontBootstrap from './FontBootstrap';
import AppRootBootstrap from './AppRootBootstrap';

export type AppBootstrapProps = {
  /** Base URL of the app. */
  baseUrl: string;

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

// const AppRootBootstrap = React.lazy(() => import('./AppRootBootstrap'));

/**
 * AppBootstrap component. Handles initializing the API, client, and authentication.
 * Will display the children when everything is loaded and authenticated.
 */
export function AppBootstrap({
  apiUrl,
  baseUrl,
  fontClassNames,
  pluginsUrl,
  children,
}: AppBootstrapProps) {
  return (
    <FontBootstrap fontClassNames={fontClassNames}>
      <AppRootBootstrap
        apiUrl={apiUrl}
        baseUrl={baseUrl}
        pluginsUrl={pluginsUrl}
      >
        {children}
      </AppRootBootstrap>
    </FontBootstrap>
  );
}

export default AppBootstrap;
