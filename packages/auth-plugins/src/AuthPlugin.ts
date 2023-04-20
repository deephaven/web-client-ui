import React from 'react';
import { CoreClient } from '@deephaven/jsapi-types';

/**
 * Map from auth config keys to their values
 * E.g. Map { AuthHandlers → "io.deephaven.auth.AnonymousAuthenticationHandler" }
 */
export type AuthConfigMap = Map<string, string>;

/**
 * Props for the auth plugin component to render
 */
export type AuthPluginProps = {
  /** Map from config keys to their values */
  authConfigValues: AuthConfigMap;

  /** Client to check auth configuration on */
  client: CoreClient;

  /** Called when authentication is sucessful */
  onSuccess(): void;

  /** Called when authentication fails */
  onFailure(error: unknown): void;
};

export type AuthPluginComponent = React.FunctionComponent<AuthPluginProps>;

/**
 * Whether the auth plugin is available given the current configuration
 */
export type AuthPluginIsAvailableFunction = (authHandlers: string[]) => boolean;

export type AuthPlugin = {
  Component: AuthPluginComponent;
  isAvailable: AuthPluginIsAvailableFunction;
};

export function isAuthPlugin(plugin?: unknown): plugin is AuthPlugin {
  if (plugin == null) return false;
  const authPlugin = plugin as AuthPlugin;
  return (
    authPlugin.Component !== undefined &&
    typeof authPlugin.isAvailable === 'function'
  );
}
