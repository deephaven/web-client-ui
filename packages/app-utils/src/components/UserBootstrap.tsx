import React, { useContext } from 'react';
import {
  UserContext,
  UserOverrideContext,
  UserPermissionsOverrideContext,
  getUserFromConfig,
} from '@deephaven/auth-plugins';
import useServerConfig from './useServerConfig';

export type UserBootstrapProps = {
  /** The children to render */
  children: React.ReactNode;
};

/**
 * UserBootstrap component. Derives the UserContext from the ServerConfigContext, UserOverrideContext, and UserPermissionsOverrideContext.
 */
export function UserBootstrap({ children }: UserBootstrapProps): JSX.Element {
  const serverConfig = useServerConfig();
  const overrides = useContext(UserOverrideContext);
  const permissionsOverrides = useContext(UserPermissionsOverrideContext);
  const user = getUserFromConfig(serverConfig, overrides, permissionsOverrides);
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export default UserBootstrap;
