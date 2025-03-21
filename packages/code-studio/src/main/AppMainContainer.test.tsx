/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Provider } from 'react-redux';
import { act, render, screen } from '@testing-library/react';
import {
  ConnectionContext,
  LocalWorkspaceStorage,
  type LayoutStorage,
} from '@deephaven/app-utils';
import { ToolType } from '@deephaven/dashboard-core-plugins';
import {
  ApiContext,
  type ObjectFetcher,
  ObjectFetcherContext,
} from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import type {
  IdeConnection,
  IdeSession,
  VariableChanges,
} from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { type Workspace, createMockStore } from '@deephaven/redux';
import userEvent from '@testing-library/user-event';
import { DEFAULT_DASHBOARD_ID } from '@deephaven/dashboard';
import { AppMainContainer } from './AppMainContainer';

function makeConnection(): IdeConnection {
  const connection = new dh.IdeConnection('http://mockserver');
  connection.getTable = jest.fn();
  connection.getObject = jest.fn();
  connection.subscribeToFieldUpdates = jest.fn();
  return connection;
}

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
  serverConfigValues = new Map<string, string>(),
  dashboardOpenedPanelMaps = {},
  connection = makeConnection(),
  session = makeSession(),
  sessionConfig = makeSessionConfig(),
  match = makeMatch(),
  plugins = new Map(),
  objectFetcher = jest.fn() as ObjectFetcher,
} = {}) {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <ApiContext.Provider value={dh}>
        <ConnectionContext.Provider value={connection}>
          <ObjectFetcherContext.Provider value={objectFetcher}>
            <AppMainContainer
              dashboardData={dashboardData}
              allDashboardData={dashboardData}
              layoutStorage={layoutStorage as LayoutStorage}
              saveWorkspace={saveWorkspace}
              updateDashboardData={updateDashboardData}
              updateWorkspaceData={updateWorkspaceData}
              user={user}
              workspace={workspace as Workspace}
              workspaceStorage={workspaceStorage}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              setDashboardIsolatedLinkerPanelId={
                setDashboardIsolatedLinkerPanelId
              }
              client={client}
              serverConfigValues={serverConfigValues}
              dashboardOpenedPanelMaps={dashboardOpenedPanelMaps}
              connection={connection}
              session={session as unknown as IdeSession}
              sessionConfig={sessionConfig}
              match={match}
              plugins={plugins}
            />
          </ObjectFetcherContext.Provider>
        </ConnectionContext.Provider>
      </ApiContext.Provider>
    </Provider>
  );
}

const EMPTY_LAYOUT = {
  filterSets: [],
  layoutConfig: [],
  links: [],
  version: 2,
};

let mockProp = {};
let mockId = DEFAULT_DASHBOARD_ID;
let mockIteration = 0;
jest.mock('@deephaven/dashboard', () => ({
  ...jest.requireActual('@deephaven/dashboard'),
  __esModule: true,
  LazyDashboard: jest.fn(({ hydrate }) => {
    const { useMemo } = jest.requireActual('react');
    // We use the `key` to determine how many times this LazyDashboard component was re-rendered with a new key
    // When rendered with a new key, the `useMemo` will be useless and will return a new key
    const key = useMemo(() => {
      const newKey = `${mockIteration}`;
      mockIteration += 1;
      return newKey;
    }, []);
    const result = hydrate(mockProp, mockId);
    if (result.fetch != null) {
      result.fetch();
    }
    return (
      <>
        <p>{JSON.stringify(result)}</p>
        <p data-testid="dashboard-key">{key}</p>
      </>
    );
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
  mockProp = {};
  mockIteration = 0;
});

afterEach(() => {
  spy.mockRestore();
});

it('mounts and unmounts AppMainContainer without crashing', () => {
  renderAppMainContainer();
});

it('listens for widgets properly', async () => {
  const user = userEvent.setup();
  const TABLE_A = { name: 'a', type: 'Table' };
  const TABLE_B = { name: 'b', type: 'Table' };
  let callback: (obj: VariableChanges) => void = null as unknown as (
    obj: VariableChanges
  ) => void;

  const connection = makeConnection();
  connection.subscribeToFieldUpdates = jest.fn(cb => {
    callback = cb;
  });

  renderAppMainContainer({ connection });

  expect(connection.subscribeToFieldUpdates).toHaveBeenCalled();

  const panelsButton = screen.getByRole('button', { name: 'Panels' });
  await user.click(panelsButton);

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
  let connection: IdeConnection;
  let objectFetcher: ObjectFetcher;
  beforeEach(() => {
    connection = makeConnection();
    objectFetcher = jest.fn();
  });

  it('hydrates empty props with defaults', () => {
    mockProp = {};
    mockId = localDashboardId;
    renderAppMainContainer({ connection });
    expect(screen.getByText('{"localDashboardId":"default"}')).toBeTruthy();
  });
  it('does not try and add fetch when metadata does not have widget metadata', () => {
    mockProp = { metadata: {} };
    mockId = localDashboardId;
    renderAppMainContainer({ connection });
    expect(
      screen.getByText('{"metadata":{},"localDashboardId":"default"}')
    ).toBeTruthy();
  });
  it('hydrates a widget properly', () => {
    mockProp = { metadata: { type: 'TestType', name: 'TestName' } };
    mockId = localDashboardId;
    expect(objectFetcher).not.toHaveBeenCalled();
    renderAppMainContainer({ objectFetcher });

    expect(
      screen.getByText(
        '{"metadata":{"type":"TestType","name":"TestName"},"localDashboardId":"default"}'
      )
    ).toBeTruthy();
    expect(objectFetcher).toHaveBeenCalled();
  });
});

describe('imports layout correctly', () => {
  it('uses a new key when layout is imported', async () => {
    renderAppMainContainer();

    expect(screen.getByText('{"localDashboardId":"default"}')).toBeTruthy();

    const oldKey = screen.getByTestId('dashboard-key').textContent ?? '';
    expect(oldKey.length).not.toBe(0);

    await act(async () => {
      const text = JSON.stringify(EMPTY_LAYOUT);
      const file = TestUtils.createMockProxy<File>({
        text: () => Promise.resolve(text),
        name: 'layout.json',
        type: 'application/json',
      });

      // Technically, the "Import Layout" button in the panels list is what the user clicks on to show the file picker
      // However, the testing library uses the `.upload` command on the `input` element directly, which we don't display
      // So just fetch it by testid and use the `.upload` command: https://testing-library.com/docs/user-event/utility/#upload
      const importInput = screen.getByTestId('input-import-layout');
      await userEvent.upload(importInput, file);
    });

    expect(screen.getByText('{"localDashboardId":"default"}')).toBeTruthy();

    const newKey = screen.getByTestId('dashboard-key').textContent ?? '';

    expect(newKey.length).not.toBe(0);
    expect(newKey).not.toBe(oldKey);
  });
});
