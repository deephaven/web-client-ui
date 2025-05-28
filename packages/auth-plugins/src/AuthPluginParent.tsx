import React from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { LOGIN_OPTIONS_REQUEST } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { getWindowParent, requestParentResponse } from '@deephaven/utils';
import { type AuthPlugin, type AuthPluginProps } from './AuthPlugin';
import AuthPluginBase from './AuthPluginBase';
import {
  UserPermissionsOverride,
  UserPermissionsOverrideContext,
} from './UserContexts';

const log = Log.module('AuthPluginParent');

const permissionsOverrides: UserPermissionsOverride = { canLogout: false };

function isLoginOptions(options: unknown): options is dh.LoginCredentials {
  return (
    options != null && typeof (options as dh.LoginCredentials).type === 'string'
  );
}

async function getLoginOptions(): Promise<dh.LoginCredentials> {
  log.info('Logging in by delegating to parent window...');
  const response = await requestParentResponse(LOGIN_OPTIONS_REQUEST);
  if (!isLoginOptions(response)) {
    throw new Error(`Unexpected login options response: ${response}`);
  }
  return response;
}

function getWindowAuthProvider(): string {
  return new URLSearchParams(window.location.search).get('authProvider') ?? '';
}

/**
 * AuthPlugin that tries to delegate to the parent window for authentication. Fails if there is no parent window.
 */
function Component({ children }: AuthPluginProps): JSX.Element {
  return (
    <AuthPluginBase getLoginOptions={getLoginOptions}>
      <UserPermissionsOverrideContext.Provider value={permissionsOverrides}>
        {children}
      </UserPermissionsOverrideContext.Provider>
    </AuthPluginBase>
  );
}

const AuthPluginParent: AuthPlugin = {
  Component,
  isAvailable: () =>
    getWindowParent() != null && getWindowAuthProvider() === 'parent',
};

export default AuthPluginParent;
