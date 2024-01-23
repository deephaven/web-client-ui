import React from 'react';
import Log from '@deephaven/log';
import Cookies from 'js-cookie';

const log = Log.module('AuthPluginPsk');

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

  /**
   * The children to render after authentication is completed.
   */
  children: React.ReactNode;
};

export type AuthPluginComponent = React.FunctionComponent<AuthPluginProps>;

/**
 * Whether the auth plugin is available given the current configuration
 */
export type AuthPluginIsAvailableFunction = (
  authHandlers: string[],
  authConfig: AuthConfigMap
) => boolean;

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

export const PSK_TOKEN_KEY = 'io.deephaven.web.client.auth.psk.token';

export function storeCookieToken(token: string | null): void {
  log.debug2('Storing token in cookie', token);
  if (token != null) {
    Cookies.set(PSK_TOKEN_KEY, token, { secure: true, sameSite: 'strict' });
  } else {
    Cookies.remove(PSK_TOKEN_KEY);
  }
}
