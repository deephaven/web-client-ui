import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  UserContext,
  UserOverrideContext,
  UserPermissionsOverrideContext,
  getUserFromConfig,
} from '@deephaven/auth-plugins';
import { setUser } from '@deephaven/redux';
import useServerConfig from './useServerConfig';

export type UserBootstrapProps = {
  /** The children to render */
  children: React.ReactNode;
};

/**
 * UserBootstrap component. Derives the UserContext from the ServerConfigContext, UserOverrideContext, and UserPermissionsOverrideContext.
 * Also sets the user in the redux store.
 */
export function UserBootstrap({ children }: UserBootstrapProps): JSX.Element {
  const serverConfig = useServerConfig();
  const overrides = useContext(UserOverrideContext);
  const permissionsOverrides = useContext(UserPermissionsOverrideContext);
  const user = getUserFromConfig(serverConfig, overrides, permissionsOverrides);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setUser(user));
  }, [dispatch, user]);
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export default UserBootstrap;
