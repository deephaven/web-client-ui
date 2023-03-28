import React from 'react';
import { CoreClient } from '@deephaven/jsapi-types';

/**
 * Props for the auth plugin component to render
 */
export type AuthPluginProps = {
  authConfigValues: Map<string, string>;
  client: CoreClient;
  onSuccess(): void;
  onFailure(error: unknown): void;
};

export type AuthPluginComponent = React.FunctionComponent<AuthPluginProps>;

/**
 * Whether the auth plugin is available given the current configuration
 */
export type AuthPluginIsAvailableFunction = (
  client: CoreClient,
  authHandlers: string[],
  authConfigValues: Map<string, string>
) => boolean;

export type AuthPlugin = {
  Component: AuthPluginComponent;
  isAvailable: AuthPluginIsAvailableFunction;
};

export function isAuthPlugin(plugin?: unknown): plugin is AuthPlugin {
  if (plugin == null) return false;
  const authPlugin = plugin as AuthPlugin;
  return (
    authPlugin.Component !== undefined && authPlugin.isAvailable !== undefined
  );
}
