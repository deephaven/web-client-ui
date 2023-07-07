import { User, UserPermissions } from '@deephaven/redux';
import Log from '@deephaven/log';

const log = Log.module('UserUtils');

/**
 * Retrieve a value from the AppInit config
 * @param serverConfig Server config map
 * @param key The AppInit key to retrieve
 * @returns The value for the AppInit key
 */
export function getAppInitValue(
  serverConfig: Map<string, string>,
  key: string
): string | undefined {
  return serverConfig.get(`internal.webClient.appInit.${key}`);
}

/**
 * Retrieve a user object provided the server config and overrides
 * @param serverConfig Server config map
 * @param overrides Override values for the user
 * @param permissionsOverrides Override specific permissions for the user
 * @returns The user object
 */
export function getUserFromConfig(
  serverConfig: Map<string, string>,
  overrides: Partial<Omit<User, 'permissions'>> = {},
  permissionsOverrides: Partial<UserPermissions> = {}
): User {
  function getValue(key: string): string | undefined {
    return getAppInitValue(serverConfig, key);
  }
  function getBooleanValue(key: string, defaultValue: boolean): boolean {
    const value = getValue(key);
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    if (value !== undefined) {
      log.warn(`Unexpected value for ${key}: ${value}`);
    }
    return defaultValue;
  }
  const name = getValue('name') ?? '';
  const operateAs = getValue('operateAs') ?? name;
  const groups = getValue('groups')?.split(',') ?? [];
  const canCopy = getBooleanValue('canCopy', true);
  const canDownloadCsv = getBooleanValue('canDownloadCsv', true);
  const canUsePanels = getBooleanValue('canUsePanels', true);
  const canLogout = getBooleanValue('canLogout', true);

  return {
    name,
    operateAs,
    groups,
    ...overrides,
    permissions: {
      canUsePanels,
      canCopy,
      canDownloadCsv,
      canLogout,
      ...permissionsOverrides,
    },
  };
}

export default { getAppInitValue, getUser: getUserFromConfig };
