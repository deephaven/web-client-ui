import React from 'react';
import { shallow } from 'enzyme';
import dh from '@deephaven/jsapi-shim';
import { AppMainContainer } from './AppMainContainer';
import ToolType from '../tools/ToolType';
import LocalWorkspaceStorage from '../dashboard/LocalWorkspaceStorage';

function makeAppMainContainer({
  user = {
    name: 'name',
    operateAs: 'operateAs',
    groups: [],
    isQueryViewOnly: false,
    isSuperUser: false,
  },
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
} = {}) {
  return shallow(
    <AppMainContainer
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
    />
  );
}

it('mounts and unmounts AppMainContainer without crashing', () => {
  const wrapper = makeAppMainContainer();
  wrapper.unmount();
});
