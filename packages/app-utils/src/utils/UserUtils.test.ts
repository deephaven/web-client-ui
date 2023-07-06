import { getAppInitValue, getUser } from './UserUtils';

it('returns the value for the AppInit key', () => {
  const serverConfig = new Map<string, string>();
  serverConfig.set('internal.webClient.appInit.name', 'test');
  serverConfig.set('internal.webClient.appInit.foo', 'bar');
  serverConfig.set('name', 'not-test');
  expect(getAppInitValue(serverConfig, 'name')).toEqual('test');
  expect(getAppInitValue(serverConfig, 'foo')).toEqual('bar');
  expect(getAppInitValue(serverConfig, 'food')).toEqual(undefined);
  expect(
    getAppInitValue(serverConfig, 'internal.webClient.appInit.name')
  ).toEqual(undefined);
  expect(getAppInitValue(serverConfig, '')).toEqual(undefined);
});

describe('getUser', () => {
  it('returns the default user and permissions', () => {
    const serverConfig = new Map<string, string>();
    expect(getUser(serverConfig)).toEqual({
      name: '',
      operateAs: '',
      groups: [],
      permissions: {
        isACLEditor: false,
        isSuperUser: false,
        isQueryViewOnly: false,
        isNonInteractive: false,
        canUsePanels: true,
        canCreateDashboard: true,
        canCreateCodeStudio: true,
        canCreateQueryMonitor: true,
        canCopy: true,
        canDownloadCsv: true,
        canLogout: true,
      },
    });
  });

  it('returns the values from the config correctly', () => {
    const serverConfig = new Map<string, string>();
    serverConfig.set('internal.webClient.appInit.name', 'test');
    serverConfig.set('internal.webClient.appInit.operateAs', 'test-operator');
    serverConfig.set('internal.webClient.appInit.groups', 'group1,group2');
    serverConfig.set('internal.webClient.appInit.isACLEditor', 'true');
    serverConfig.set('internal.webClient.appInit.isSuperUser', 'true');
    serverConfig.set('internal.webClient.appInit.isQueryViewOnly', 'true');
    serverConfig.set('internal.webClient.appInit.isNonInteractive', 'true');
    serverConfig.set('internal.webClient.appInit.canUsePanels', 'false');
    serverConfig.set('internal.webClient.appInit.canCreateDashboard', 'false');
    serverConfig.set('internal.webClient.appInit.canCreateCodeStudio', 'false');
    serverConfig.set(
      'internal.webClient.appInit.canCreateQueryMonitor',
      'false'
    );
    serverConfig.set('internal.webClient.appInit.canCopy', 'false');
    serverConfig.set('internal.webClient.appInit.canDownloadCsv', 'false');
    serverConfig.set('internal.webClient.appInit.canLogout', 'false');
    expect(getUser(serverConfig)).toEqual({
      name: 'test',
      operateAs: 'test-operator',
      groups: ['group1', 'group2'],
      permissions: {
        isACLEditor: true,
        isSuperUser: true,
        isQueryViewOnly: true,
        isNonInteractive: true,
        canUsePanels: false,
        canCreateDashboard: false,
        canCreateCodeStudio: false,
        canCreateQueryMonitor: false,
        canCopy: false,
        canDownloadCsv: false,
        canLogout: false,
      },
    });
  });

  it('overrides the default values correctly', () => {
    const serverConfig = new Map<string, string>();
    serverConfig.set('internal.webClient.appInit.name', 'test');
    serverConfig.set('internal.webClient.appInit.operateAs', 'test-operator');
    serverConfig.set('internal.webClient.appInit.groups', 'group1,group2');
    serverConfig.set('internal.webClient.appInit.isACLEditor', 'true');
    serverConfig.set('internal.webClient.appInit.isSuperUser', 'true');
    serverConfig.set('internal.webClient.appInit.isQueryViewOnly', 'true');
    serverConfig.set('internal.webClient.appInit.isNonInteractive', 'true');
    serverConfig.set('internal.webClient.appInit.canUsePanels', 'false');
    serverConfig.set('internal.webClient.appInit.canCreateDashboard', 'false');
    serverConfig.set('internal.webClient.appInit.canCreateCodeStudio', 'false');
    serverConfig.set(
      'internal.webClient.appInit.canCreateQueryMonitor',
      'false'
    );
    serverConfig.set('internal.webClient.appInit.canCopy', 'false');
    serverConfig.set('internal.webClient.appInit.canDownloadCsv', 'false');
    serverConfig.set('internal.webClient.appInit.canLogout', 'false');
    expect(
      getUser(
        serverConfig,
        {
          name: 'test2',
          operateAs: 'test2-operator',
          groups: ['group3', 'group4'],
        },
        {
          isACLEditor: false,
          isSuperUser: false,
          isQueryViewOnly: false,
          isNonInteractive: false,
          canUsePanels: true,
          canCreateDashboard: true,
          canCreateCodeStudio: true,
          canCreateQueryMonitor: true,
          canCopy: true,
          canDownloadCsv: true,
          canLogout: true,
        }
      )
    ).toEqual({
      name: 'test2',
      operateAs: 'test2-operator',
      groups: ['group3', 'group4'],
      permissions: {
        isACLEditor: false,
        isSuperUser: false,
        isQueryViewOnly: false,
        isNonInteractive: false,
        canUsePanels: true,
        canCreateDashboard: true,
        canCreateCodeStudio: true,
        canCreateQueryMonitor: true,
        canCopy: true,
        canDownloadCsv: true,
        canLogout: true,
      },
    });
  });
});
