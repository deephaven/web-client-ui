import React from 'react';
import { LoginOptions } from '@deephaven/jsapi-types';
import {
  LOGIN_OPTIONS_REQUEST,
  requestParentResponse,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { AuthPlugin, AuthPluginProps } from './AuthPlugin';
import AuthPluginBase from './AuthPluginBase';
import {
  UserPermissionsOverride,
  UserPermissionsOverrideContext,
} from './UserContexts';

const log = Log.module('AuthPluginParent');

const permissionsOverrides: UserPermissionsOverride = { canLogout: false };

function getLoginOptions(): Promise<LoginOptions> {
  log.info('Logging in by delegating to parent window...');
  return requestParentResponse<LoginOptions>(LOGIN_OPTIONS_REQUEST);
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
    window.opener != null && getWindowAuthProvider() === 'parent',
};

export default AuthPluginParent;
