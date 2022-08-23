/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToolType } from '@deephaven/dashboard-core-plugins';
import dh, { IdeSession, VariableChanges } from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import { Workspace } from '@deephaven/redux';
import userEvent from '@testing-library/user-event';
import { DEFAULT_DASHBOARD_ID } from '@deephaven/dashboard';
import { AppMainContainer, DashboadData } from './AppMainContainer';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';
import LayoutStorage from '../storage/LayoutStorage';

function makeSession(): Partial<IdeSession> {
  return {
    addEventListener: jest.fn(),
    subscribeToFieldUpdates: jest.fn(),
    removeEventListener: jest.fn(),
    getTable: jest.fn(),
    getObject: jest.fn(),
    runCode: jest.fn(),
  } as Partial<IdeSession>;
}

function makeSessionConfig() {
  return { type: 'Test', id: 'test' };
}

function makeMatch() {
  return {
    params: {
      notebookPath: '/test/',
    },
  };
}

function renderAppMainContainer({
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
  client = new (dh as any).Client({}),
  serverConfigValues = {},
  dashboardOpenedPanelMaps = {},
  session = makeSession(),
  sessionConfig = makeSessionConfig(),
  match = makeMatch(),
  plugins = new Map(),
} = {}) {
  return render(
    <AppMainContainer
      dashboardData={dashboardData as DashboadData}
      layoutStorage={layoutStorage as LayoutStorage}
      saveWorkspace={saveWorkspace}
      updateDashboardData={updateDashboardData}
      updateWorkspaceData={updateWorkspaceData}
      user={user}
      workspace={workspace as Workspace}
      workspaceStorage={workspaceStorage}
      activeTool={activeTool}
      setActiveTool={setActiveTool}
      setDashboardIsolatedLinkerPanelId={setDashboardIsolatedLinkerPanelId}
      client={client}
      serverConfigValues={serverConfigValues}
      dashboardOpenedPanelMaps={dashboardOpenedPanelMaps}
      session={(session as unknown) as IdeSession}
      sessionConfig={sessionConfig}
      match={match}
      plugins={plugins}
    />
  );
}
let mockProp = {};
let mockId = DEFAULT_DASHBOARD_ID;
jest.mock('@deephaven/dashboard', () => ({
  ...jest.requireActual('@deephaven/dashboard'),
  __esModule: true,
  Dashboard: jest.fn(({ hydrate }) => {
    const result = hydrate(mockProp, mockId);
    if (result.fetch) {
      result.fetch();
    }
    return <p>{JSON.stringify(result)}</p>;
  }),
  default: jest.fn(),
}));

let spy: jest.SpyInstance<number, [callback: FrameRequestCallback]>;
beforeEach(() => {
  spy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    // mock request animation frame
    // see https://github.com/deephaven/web-client-ui/issues/508
    // only safe to mock like this if RAF is non-recursive
    cb(0);
    return 0;
  });
});

afterEach(() => {
  spy.mockRestore();
});

it('mounts and unmounts AppMainContainer without crashing', () => {
  renderAppMainContainer();
});

it('listens for widgets properly', () => {
  const TABLE_A = { name: 'a', type: 'Table' };
  const TABLE_B = { name: 'b', type: 'Table' };
  let callback: (obj: VariableChanges) => void = (null as unknown) as (
    obj: VariableChanges
  ) => void;

  const session = makeSession();
  session.subscribeToFieldUpdates = jest.fn(cb => {
    callback = cb;
  });

  renderAppMainContainer({ session });

  expect(session.subscribeToFieldUpdates).toHaveBeenCalled();

  const panelsButton = screen.getByRole('button', { name: 'Panels' });
  userEvent.click(panelsButton);

  expect(screen.getByText('No bound variables found.')).toBeTruthy();

  callback({
    created: [TABLE_A],
    removed: [],
    updated: [],
  });

  expect(screen.getByRole('button', { name: 'a' })).toBeTruthy();

  callback({
    created: [TABLE_B],
    removed: [],
    updated: [TABLE_A],
  });

  expect(screen.getByRole('button', { name: 'a' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'b' })).toBeTruthy();

  callback({
    created: [],
    removed: [TABLE_A],
    updated: [],
  });

  expect(screen.queryByRole('button', { name: 'a' })).toBeNull();
  expect(screen.getByRole('button', { name: 'b' })).toBeTruthy();

  callback({
    created: [TABLE_A],
    removed: [TABLE_B],
    updated: [],
  });

  expect(screen.queryByRole('button', { name: 'b' })).toBeNull();
  expect(screen.getByRole('button', { name: 'a' })).toBeTruthy();
});

describe('hydrates widgets correctly', () => {
  const localDashboardId = DEFAULT_DASHBOARD_ID;
  let session: Partial<IdeSession> = (null as unknown) as Partial<IdeSession>;
  beforeEach(() => {
    session = makeSession();
  });

  it('hydrates empty props with defaults', () => {
    mockProp = {};
    mockId = localDashboardId;
    renderAppMainContainer({ session });
    expect(
      screen.getByText('{"metadata":{},"localDashboardId":"default"}')
    ).toBeTruthy();
  });
  it('does not try and add fetch when metadata does not have widget metadata', () => {
    mockProp = { metadata: {} };
    mockId = localDashboardId;
    renderAppMainContainer({ session });
    expect(
      screen.getByText('{"metadata":{},"localDashboardId":"default"}')
    ).toBeTruthy();
  });
  it('hydrates a widget properly', () => {
    mockProp = { metadata: { type: 'TestType', name: 'TestName' } };
    mockId = localDashboardId;
    expect(session.getObject).not.toHaveBeenCalled();
    renderAppMainContainer({ session });

    expect(
      screen.getByText(
        '{"localDashboardId":"default","metadata":{"type":"TestType","name":"TestName"}}'
      )
    ).toBeTruthy();
    expect(session.getObject).toHaveBeenCalled();
  });
});
