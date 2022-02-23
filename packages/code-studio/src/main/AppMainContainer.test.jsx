import React from 'react';
import { shallow } from 'enzyme';
import { ToolType } from '@deephaven/dashboard-core-plugins';
import { DEFAULT_DASHBOARD_ID } from '@deephaven/dashboard';
import dh from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import { AppMainContainer } from './AppMainContainer';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';

function makeSession() {
  return {
    addEventListener: jest.fn(),
    connection: {
      subscribeToFieldUpdates: jest.fn(),
    },
    removeEventListener: jest.fn(),
    getTable: jest.fn(),
    getObject: jest.fn(),
    runCode: jest.fn(),
  };
}

function makeSessionConfig() {
  return { type: 'Test' };
}

function makeMatch() {
  return {
    params: {
      notebookPath: '/test/',
    },
  };
}

function makeAppMainContainer({
  layoutStorage = {},
  user = TestUtils.REGULAR_USER,
  dashboardData = {},
  saveWorkspace = jest.fn(() => Promise.resolve()),
  updateDashboardData = jest.fn(() => Promise.resolve()),
  updateWorkspaceData = jest.fn(() => Promise.resolve()),
  workspace = { data: {} },
  workspaceStorage = new LocalWorkspaceStorage(),
  activeTool = ToolType.DEFAULT,
  setActiveTool = jest.fn(),
  setDashboardIsolatedLinkerPanelId = jest.fn(),
  client = new dh.Client({}),
  serverConfigValues = {},
  dashboardOpenedPanelMaps = {},
  session = makeSession(),
  sessionConfig = makeSessionConfig(),
  match = makeMatch(),
  plugins = new Map(),
} = {}) {
  return shallow(
    <AppMainContainer
      dashboardData={dashboardData}
      layoutStorage={layoutStorage}
      saveWorkspace={saveWorkspace}
      updateDashboardData={updateDashboardData}
      updateWorkspaceData={updateWorkspaceData}
      user={user}
      workspace={workspace}
      workspaceStorage={workspaceStorage}
      activeTool={activeTool}
      setActiveTool={setActiveTool}
      setDashboardIsolatedLinkerPanelId={setDashboardIsolatedLinkerPanelId}
      client={client}
      serverConfigValues={serverConfigValues}
      dashboardOpenedPanelMaps={dashboardOpenedPanelMaps}
      session={session}
      sessionConfig={sessionConfig}
      match={match}
      plugins={plugins}
    />
  );
}

it('mounts and unmounts AppMainContainer without crashing', () => {
  const wrapper = makeAppMainContainer();
  wrapper.unmount();
});

it('listens for widgets properly', () => {
  const TABLE_A = { name: 'a', type: 'Table' };
  const TABLE_B = { name: 'b', type: 'Table' };
  let callback = null;

  const session = makeSession();
  session.connection.subscribeToFieldUpdates = jest.fn(cb => {
    callback = cb;
  });

  const wrapper = makeAppMainContainer({ session });

  expect(wrapper.state('widgets')).toEqual(expect.arrayContaining([]));
  expect(session.connection.subscribeToFieldUpdates).toHaveBeenCalled();

  callback({
    created: [TABLE_A],
    removed: [],
    updated: [],
  });

  expect(wrapper.state('widgets')).toEqual(expect.arrayContaining([TABLE_A]));

  callback({
    created: [TABLE_B],
    removed: [],
    updated: [TABLE_A],
  });

  expect(wrapper.state('widgets')).toEqual(
    expect.arrayContaining([TABLE_A, TABLE_B])
  );

  callback({
    created: [],
    removed: [TABLE_A],
    updated: [],
  });

  expect(wrapper.state('widgets')).toEqual(expect.arrayContaining([TABLE_B]));

  callback({
    created: [TABLE_A],
    removed: [TABLE_B],
    updated: [],
  });

  expect(wrapper.state('widgets')).toEqual(expect.arrayContaining([TABLE_A]));

  wrapper.unmount();
});

describe('hydrates widgets correctly', () => {
  const localDashboardId = DEFAULT_DASHBOARD_ID;
  let session = null;
  let wrapper = null;

  beforeEach(() => {
    session = makeSession();
    wrapper = makeAppMainContainer({ session });
  });

  it('hydrates empty props with defaults', () => {
    const result = wrapper.instance().hydrateDefault({}, localDashboardId);
    expect(result).toEqual(
      expect.objectContaining({
        localDashboardId: DEFAULT_DASHBOARD_ID,
      })
    );
    expect(result).not.toEqual(expect.objectContaining({ fetch: expect.any }));
  });

  it('does not try and add fetch when metadata does not have widget metadata', () => {
    const result = wrapper
      .instance()
      .hydrateDefault({ metadata: {} }, localDashboardId);
    expect(result).toEqual(
      expect.objectContaining({
        localDashboardId: DEFAULT_DASHBOARD_ID,
      })
    );
    expect(result).not.toEqual(expect.objectContaining({ fetch: expect.any }));
  });

  it('hydrates a widget properly', () => {
    const result = wrapper
      .instance()
      .hydrateDefault(
        { metadata: { type: 'TestType', name: 'TestName' } },
        localDashboardId
      );
    expect(result).toEqual(
      expect.objectContaining({
        localDashboardId: DEFAULT_DASHBOARD_ID,
        fetch: expect.any(Function),
      })
    );
    expect(session.getObject).not.toHaveBeenCalled();
    result.fetch();
    expect(session.getObject).toHaveBeenCalled();
  });
});
