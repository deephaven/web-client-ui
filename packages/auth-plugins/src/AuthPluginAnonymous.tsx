import React, { useCallback } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { AUTH_HANDLER_TYPE_ANONYMOUS } from './AuthHandlerTypes';
import { AuthPlugin, AuthPluginProps } from './AuthPlugin';
import AuthPluginBase from './AuthPluginBase';
import {
  UserPermissionsOverride,
  UserPermissionsOverrideContext,
} from './UserContexts';

const permissionsOverrides: UserPermissionsOverride = { canLogout: false };

/**
 * AuthPlugin that tries to login anonymously. Fails if anonymous login fails
 */
function Component({ children }: AuthPluginProps): JSX.Element {
  const dh = useApi();

  const getLoginOptions = useCallback(
    async () => ({ type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS }),
    [dh]
  );

  return (
    <AuthPluginBase getLoginOptions={getLoginOptions}>
      <UserPermissionsOverrideContext.Provider value={permissionsOverrides}>
        {children}
      </UserPermissionsOverrideContext.Provider>
    </AuthPluginBase>
  );
}

const AuthPluginAnonymous: AuthPlugin = {
  Component,
  isAvailable: authHandlers =>
    authHandlers.includes(AUTH_HANDLER_TYPE_ANONYMOUS),
};

export default AuthPluginAnonymous;
