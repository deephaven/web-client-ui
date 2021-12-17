import React from 'react';
import { shallow } from 'enzyme';
import ToolType from '@deephaven/dashboard-core-plugins/dist/linker/ToolType';
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
    runCode: jest.fn(),
  };
}

function makeAppMainContainer({
  layoutStorage = {},
  user = TestUtils.REGULAR_USER,
  dashboardData = {},
  saveWorkspace = jest.fn(() => Promise.resolve()),
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
} = {}) {
  return shallow(
    <AppMainContainer
      dashboardData={dashboardData}
      layoutStorage={layoutStorage}
      saveWorkspace={saveWorkspace}
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
