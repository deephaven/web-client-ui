/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint func-names: "off" */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { IrisGridModelFactory, IrisGridUtils } from '@deephaven/iris-grid';
import dh from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/test-utils';
import type { Container } from '@deephaven/golden-layout';
import { type Workspace } from '@deephaven/redux';
import { IrisGridPanel } from './IrisGridPanel';

const MockIrisGrid: React.FC & jest.Mock = jest.fn(() => null);

jest.mock('@deephaven/iris-grid', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    ...(jest.requireActual('@deephaven/iris-grid') as Record<string, unknown>),
    // eslint-disable-next-line react/jsx-props-no-spreading
    IrisGrid: forwardRef((props, ref) => <MockIrisGrid {...props} />),
  };
});

jest.mock('@deephaven/dashboard', () => ({
  ...(jest.requireActual('@deephaven/dashboard') as Record<string, unknown>),
  LayoutUtils: {
    getIdFromPanel: jest.fn(() => 'TEST_ID'),
    getTitleFromContainer: jest.fn(() => 'TEST_PANEL_TITLE'),
  },
}));

function makeTable() {
  const columns = [new (dh as any).Column({ index: 0, name: '0' })];
  return new (dh as any).Table({ columns });
}

function makeGlComponent() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    trigger: jest.fn(),
    unbind: jest.fn(),
  };
}

function makeMakeModel(table = makeTable()) {
  return () =>
    Promise.resolve(table).then(resolved =>
      IrisGridModelFactory.makeModel(dh, resolved)
    );
}

function makeIrisGridPanelWrapper(
  makeModel = makeMakeModel(),
  metadata = { table: 'table' },
  glContainer = makeGlComponent(),
  glEventHub = makeGlComponent(),
  inputFilters = [],
  links = [],
  user = TestUtils.REGULAR_USER,
  client = new (dh as any).Client(),
  workspace = {},
  settings = { timeZone: 'America/New_York' },
  transformTableOptions:
    | ((defaults: readonly any[]) => readonly any[])
    | undefined = undefined,
  transformModel: ((model: any) => any) | undefined = undefined
) {
  const panel = (
    <IrisGridPanel
      makeModel={makeModel}
      metadata={metadata}
      glContainer={glContainer as unknown as Container}
      glEventHub={glEventHub}
      user={user}
      inputFilters={inputFilters}
      links={links}
      workspace={workspace as Workspace}
      settings={settings}
      panelState={undefined}
      getDownloadWorker={() => undefined}
      loadPlugin={() => undefined}
      transformTableOptions={transformTableOptions}
      transformModel={transformModel}
    />
  );
  return render(panel);
}

async function expectLoading(container) {
  await waitFor(() =>
    expect(
      container.querySelector('[role=progressbar].loading-spinner-large')
    ).toBeInTheDocument()
  );
}

async function expectNotLoading(container) {
  await waitFor(() =>
    expect(
      container.querySelector("[data-icon='outline']")
    ).not.toBeInTheDocument()
  );
  expect(
    container.querySelector('[role=progressbar].loading-spinner-large')
  ).not.toBeInTheDocument();
}

it('mounts and unmounts without crashing', async () => {
  await act(() => makeIrisGridPanelWrapper());
});

it('unmounts while still resolving a table successfully', async () => {
  const table = makeTable();
  let tableResolve = null;
  const tablePromise = new Promise(resolve => {
    tableResolve = resolve;
  });
  const makeModel = makeMakeModel(tablePromise);

  const { unmount } = makeIrisGridPanelWrapper(makeModel);
  const spy = jest.spyOn(IrisGridPanel.prototype, 'setState');
  unmount();

  tableResolve(table);
  expect(spy).toHaveBeenCalledTimes(0);
  expect.assertions(1);
});

it('shows the loading spinner until grid is ready', async () => {
  const table = makeTable();
  const tablePromise = Promise.resolve(table);
  const makeModel = makeMakeModel(tablePromise);

  expect.assertions(4);
  const { container } = makeIrisGridPanelWrapper(makeModel);

  await expectLoading(container);

  await expectLoading(container);
  const params = (
    MockIrisGrid.mock.calls[MockIrisGrid.mock.calls.length - 1] as unknown as {
      onStateChange: (param1: unknown, param2: unknown) => any;
    }[]
  )[0];
  act(() => params.onStateChange({}, {}));

  await expectNotLoading(container);
});

it('shows an error properly if table loading fails', async () => {
  const error = new Error('TEST ERROR MESSAGE');
  const tablePromise = Promise.reject(error);
  const makeModel = makeMakeModel(tablePromise);
  const { container } = makeIrisGridPanelWrapper(makeModel);
  await expectNotLoading(container);
  const msg = screen.getByText(
    'Unable to open table. Error: TEST ERROR MESSAGE'
  );
  expect(msg).toBeTruthy();
});

it('forwards the transformTableOptions prop to IrisGrid.transformTableOptions', async () => {
  MockIrisGrid.mockClear();
  const transformTableOptions = jest.fn(defaults => defaults);
  await act(() =>
    makeIrisGridPanelWrapper(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      transformTableOptions
    )
  );
  const { calls } = MockIrisGrid.mock;
  expect(calls.length).toBeGreaterThan(0);
  const lastProps = calls[calls.length - 1][0];
  expect(lastProps.transformTableOptions).toBe(transformTableOptions);
});

it('passes undefined transformTableOptions when the prop is omitted', async () => {
  MockIrisGrid.mockClear();
  await act(() => makeIrisGridPanelWrapper());
  const { calls } = MockIrisGrid.mock;
  expect(calls.length).toBeGreaterThan(0);
  const lastProps = calls[calls.length - 1][0];
  expect(lastProps.transformTableOptions).toBeUndefined();
});

it('applies transformModel to the built model before passing it to IrisGrid', async () => {
  MockIrisGrid.mockClear();
  const transformedModel = await makeMakeModel()();
  const transformModel = jest.fn(() => transformedModel);
  await act(() =>
    makeIrisGridPanelWrapper(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      transformModel
    )
  );
  expect(transformModel).toHaveBeenCalledTimes(1);
  const { calls } = MockIrisGrid.mock;
  expect(calls.length).toBeGreaterThan(0);
  const lastProps = calls[calls.length - 1][0];
  expect(lastProps.model).toBe(transformedModel);
});

it('keeps the table plugin when saved custom columns drop the PluginName attribute', async () => {
  MockIrisGrid.mockClear();
  const table = makeTable();
  table.pluginName = 'TestPlugin';
  table.applyCustomColumns = jest.fn(customColumns => {
    // Mirrors the server: updateView does not copy PluginName
    table.pluginName = null;
    setTimeout(() =>
      table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED)
    );
    return customColumns;
  });
  const Plugin = jest.fn(() => null);
  const loadPlugin = jest.fn(() => Plugin);
  const panelState = {
    gridState: {},
    irisGridState: { customColumns: ['Foo = 1'] },
    irisGridPanelState: {},
    pluginState: null,
  };

  render(
    <IrisGridPanel
      makeModel={makeMakeModel(table)}
      metadata={{ table: 'table' } as any}
      glContainer={makeGlComponent() as unknown as Container}
      glEventHub={makeGlComponent() as any}
      user={TestUtils.REGULAR_USER}
      inputFilters={[]}
      links={[]}
      settings={{ timeZone: 'America/New_York' } as any}
      panelState={panelState as any}
      loadPlugin={loadPlugin as any}
    />
  );

  await waitFor(() => expect(MockIrisGrid).toHaveBeenCalled());
  expect(table.applyCustomColumns).toHaveBeenCalled();
  expect(table.pluginName).toBeNull();
  expect(loadPlugin).toHaveBeenCalledTimes(1);
  expect(loadPlugin).toHaveBeenCalledWith('TestPlugin');
  const { calls } = MockIrisGrid.mock;
  const lastProps = calls[calls.length - 1][0];
  expect(lastProps.children).not.toBeNull();
});

it('closes the base model if transformModel rejects', async () => {
  MockIrisGrid.mockClear();
  const baseModel = TestUtils.createMockProxy<any>({ close: jest.fn() });
  const makeModel = jest.fn(() => Promise.resolve(baseModel));
  const error = new Error('Transform failed');
  const transformModel = jest.fn(() => Promise.reject(error));
  const { container } = makeIrisGridPanelWrapper(
    makeModel,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    transformModel
  );
  await expectNotLoading(container);
  expect(transformModel).toHaveBeenCalledTimes(1);
  expect(baseModel.close).toHaveBeenCalledTimes(1);
});

/**
 * Build the state IrisGrid reports through `onStateChange` from the props the
 * panel passes it, as the IrisGrid constructor does for the persisted keys.
 * IrisGrid is mocked in these tests, so this stands in for the real grid.
 */
function makeIrisGridStateFromProps(props: Record<string, any>) {
  return {
    advancedFilters: new Map(props.advancedFilters),
    aggregationSettings: props.aggregationSettings,
    customColumnFormatMap: new Map(props.customColumnFormatMap),
    columnAlignmentMap: new Map(props.columnAlignmentMap),
    conditionalFormats: props.conditionalFormats,
    customColumns: props.customColumns,
    frozenColumns: props.frozenColumns,
    invertSearchColumns: props.invertSearchColumns,
    isFilterBarShown: props.isFilterBarShown,
    partitionConfig: props.partitionConfig,
    pendingDataMap: props.pendingDataMap ?? new Map(),
    quickFilters: new Map(props.quickFilters),
    reverse: props.reverse,
    rollupConfig: props.rollupConfig,
    searchValue: props.searchValue,
    selectDistinctColumns: props.selectDistinctColumns,
    selectedSearchColumns: props.selectedSearchColumns ?? [],
    showSearchBar: props.showSearchBar,
    sorts: props.sorts,
    columnHeaderGroups:
      props.columnHeaderGroups ?? props.model.initialColumnHeaderGroups,
  };
}

function makeGridStateFromProps(props: Record<string, any>) {
  return {
    isStuckToBottom: props.isStuckToBottom,
    isStuckToRight: props.isStuckToRight,
    movedColumns: props.movedColumns,
    movedRows: props.movedRows,
  };
}

/**
 * Detects drift between the state an unmodified panel saves and the frozen
 * defaults `IrisGridUtils` removes before the state is stored. What a failure
 * means depends on the assertion:
 *
 * - Unexpected leftover key: a UI default changed. Add the key to the expected
 *   leftovers; state with the new default is then stored explicitly, which only
 *   reduces the saving. Do not change the frozen default to match, since
 *   stored state relies on it (see the "frozen state defaults" tests in
 *   IrisGridUtils.test.ts).
 * - Restored state differs from the saved state: a saved property was renamed
 *   or removed but its frozen default wasn't. Restoring then adds a key the
 *   panel never saves, so a loaded dashboard never matches the live one. Remove
 *   the stale key from the frozen defaults (renamed properties also need a
 *   migration for stored values).
 */
describe('saved panel state of an unmodified panel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('matches the frozen defaults', async () => {
    const onPanelStateUpdate = jest.fn();
    MockIrisGrid.mockClear();
    render(
      <IrisGridPanel
        makeModel={makeMakeModel()}
        metadata={{ table: 'table' }}
        glContainer={makeGlComponent() as unknown as Container}
        glEventHub={makeGlComponent()}
        user={TestUtils.REGULAR_USER}
        inputFilters={[]}
        links={[]}
        workspace={{} as Workspace}
        settings={{ timeZone: 'America/New_York' }}
        panelState={undefined}
        getDownloadWorker={() => undefined}
        loadPlugin={() => undefined}
        onPanelStateUpdate={onPanelStateUpdate}
      />
    );
    await waitFor(() => expect(MockIrisGrid).toHaveBeenCalled());
    const props = (
      MockIrisGrid.mock.calls[
        MockIrisGrid.mock.calls.length - 1
      ] as unknown as [Record<string, any>]
    )[0];

    act(() => {
      props.onStateChange(
        makeIrisGridStateFromProps(props),
        makeGridStateFromProps(props)
      );
      jest.runOnlyPendingTimers();
    });

    expect(onPanelStateUpdate).toHaveBeenCalledTimes(1);
    const [panelState] = onPanelStateUpdate.mock.calls[0];
    // Compare what would be stored, i.e. without undefined values
    const storedPanelState = JSON.parse(JSON.stringify(panelState));

    const withoutDefaults =
      IrisGridUtils.removePanelStateDefaults(storedPanelState);

    expect(IrisGridUtils.restorePanelStateDefaults(withoutDefaults)).toEqual(
      storedPanelState
    );
    expect(withoutDefaults).toEqual({
      // Not frozen defaults: an empty list differs from a missing value,
      // which falls back to the model's column header groups
      irisGridState: { columnHeaderGroups: [] },
      gridState: {},
      irisGridPanelState: {},
      pluginState: null,
    });
  });
});
