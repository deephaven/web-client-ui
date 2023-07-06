import { User, UserPermissions } from '@deephaven/redux';

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
export function getUser(
  serverConfig: Map<string, string>,
  overrides: Partial<Omit<User, 'permissions'>> = {},
  permissionsOverrides: Partial<UserPermissions> = {}
): User {
  function getValue(key: string): string | undefined {
    return getAppInitValue(serverConfig, key);
  }
  function getBooleanValue(key: string, defaultValue = true): boolean {
    if (defaultValue) {
      return !(getValue(key) === 'false');
    }
    return getValue(key) === 'true';
  }
  const name = getValue('name') ?? '';
  const operateAs = getValue('operateAs') ?? name;
  const groups = getValue('groups')?.split(',') ?? [];
  const isACLEditor = getBooleanValue('isACLEditor', false);
  const isSuperUser = getBooleanValue('isSuperUser', false);
  const isQueryViewOnly = getBooleanValue('isQueryViewOnly', false);
  const isNonInteractive = getBooleanValue('isNonInteractive', false);
  const canCopy = getBooleanValue('canCopy', true);
  const canDownloadCsv = getBooleanValue('canDownloadCsv', true);
  const canCreateDashboard = getBooleanValue('canCreateDashboard', true);
  const canCreateCodeStudio = getBooleanValue('canCreateCodeStudio', true);
  const canCreateQueryMonitor = getBooleanValue('canCreateQueryMonitor', true);
  const canUsePanels = getBooleanValue('canUsePanels', true);
  const canLogout = getBooleanValue('canLogout', true);

  return {
    name,
    operateAs,
    groups,
    ...overrides,
    permissions: {
      isACLEditor,
      isSuperUser,
      isQueryViewOnly,
      isNonInteractive,
      canUsePanels,
      canCreateDashboard,
      canCreateCodeStudio,
      canCreateQueryMonitor,
      canCopy,
      canDownloadCsv,
      canLogout,
      ...permissionsOverrides,
    },
  };
}

export default { getAppInitValue, getUser };
