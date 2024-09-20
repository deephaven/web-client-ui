import { createContext } from 'react';
import { type User, type UserPermissions } from '@deephaven/redux';

export type UserOverride = Partial<Omit<User, 'permissions'>>;

export type UserPermissionsOverride = Partial<UserPermissions>;

export const UserOverrideContext = createContext<UserOverride>({});

export const UserPermissionsOverrideContext =
  createContext<UserPermissionsOverride>({});

export const UserContext = createContext<User | null>(null);
