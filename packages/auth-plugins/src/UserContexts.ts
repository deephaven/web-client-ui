import { createContext } from 'react';
import { User, UserPermissions } from '@deephaven/redux';

export type UserOverride = Partial<Omit<User, 'permissions'>>;

export type UserPermissionsOverride = Partial<UserPermissions>;

export const UserOverrideContext = createContext<UserOverride>({});

export const UserPermissionsOverrideContext = createContext<UserPermissionsOverride>(
  {}
);
