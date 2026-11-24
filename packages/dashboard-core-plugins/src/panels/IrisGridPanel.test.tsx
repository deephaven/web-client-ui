/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint func-names: "off" */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
  IrisGridMetricCalculator,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridUtils,
} from '@deephaven/iris-grid';
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
 * Detects drift between the panel's initial state and the frozen defaults that
 * `IrisGridUtils` omits when dehydrating. An unmodified panel should save
 * almost nothing.
 *
 * If this fails with an unexpected key, a UI default changed. Add the key to
 * the expected result: state with the new default is then saved explicitly,
 * which only reduces the saving. Do not change the frozen default to match,
 * since saved state relies on it (see the "frozen state defaults" tests in
 * IrisGridUtils.test.ts).
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

    expect(storedPanelState).toEqual({
      // Not frozen defaults: an empty list differs from a missing value,
      // which falls back to the model's column header groups
      irisGridState: { columnHeaderGroups: [] },
      gridState: {},
      irisGridPanelState: {},
      pluginState: null,
    });
  });
});

function makeCustomColumnsPanelState(customColumns: string[]) {
  return {
    gridState: {},
    irisGridState: { customColumns },
    irisGridPanelState: {},
    pluginState: null,
  };
}

it('applies saved custom columns before transformModel runs', async () => {
  MockIrisGrid.mockClear();
  const table = makeTable();
  table.applyCustomColumns = jest.fn(customColumns => {
    setTimeout(() =>
      table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED)
    );
    return customColumns;
  });
  let customColumnCallsAtTransform = -1;
  const transformModel = jest.fn(model => {
    customColumnCallsAtTransform = table.applyCustomColumns.mock.calls.length;
    return model;
  });

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
      panelState={makeCustomColumnsPanelState(['Foo = 1']) as any}
      loadPlugin={() => undefined}
      transformModel={transformModel}
    />
  );

  await waitFor(() => expect(MockIrisGrid).toHaveBeenCalled());
  expect(transformModel).toHaveBeenCalledTimes(1);
  expect(customColumnCallsAtTransform).toBe(1);
  expect(table.applyCustomColumns).toHaveBeenCalledWith(['Foo = 1']);
});

it('shows an error if applying saved custom columns fails', async () => {
  MockIrisGrid.mockClear();
  const table = makeTable();
  const error = new Error('Bad custom column');
  let model: IrisGridModel | undefined;
  table.applyCustomColumns = jest.fn(() => {
    setTimeout(
      () =>
        model?.dispatchEvent(
          new CustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
            detail: error,
          })
        )
    );
    return [];
  });
  const makeModel = async () => {
    model = await IrisGridModelFactory.makeModel(dh, table);
    return model;
  };

  const { container } = render(
    <IrisGridPanel
      makeModel={makeModel}
      metadata={{ table: 'table' } as any}
      glContainer={makeGlComponent() as unknown as Container}
      glEventHub={makeGlComponent() as any}
      user={TestUtils.REGULAR_USER}
      inputFilters={[]}
      links={[]}
      settings={{ timeZone: 'America/New_York' } as any}
      panelState={makeCustomColumnsPanelState(['Foo = 1']) as any}
      loadPlugin={() => undefined}
    />
  );

  await waitFor(() =>
    expect(
      screen.getByText('Unable to open table. Error: Bad custom column')
    ).toBeInTheDocument()
  );
  expect(
    container.querySelector('[role=progressbar].loading-spinner-large')
  ).not.toBeInTheDocument();
  expect(MockIrisGrid).not.toHaveBeenCalled();
});

describe('cancelling and reconnecting during hydration', () => {
  /** Table whose custom columns apply only when `fireCustomColumnsChanged` is called. */
  function makePendingCustomColumnsTable() {
    const table = makeTable();
    table.applyCustomColumns = jest.fn(customColumns => customColumns);
    return {
      table,
      fireCustomColumnsChanged: () =>
        table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED),
    };
  }

  /** `makeModel` that records the models it builds and spies on their `close`. */
  function makeTrackedMakeModel(tables: unknown[]) {
    const models: IrisGridModel[] = [];
    const makeModel = jest.fn(async () => {
      const model = await IrisGridModelFactory.makeModel(
        dh,
        tables[models.length] as any
      );
      // IrisGridProxyModel's set trap forwards to its inner model, so spyOn
      // would miss the proxy's own close; an own property is read first
      Object.defineProperty(model, 'close', {
        value: jest.fn(model.close.bind(model)),
        configurable: true,
        writable: true,
      });
      models.push(model);
      return model;
    });
    return { makeModel, models };
  }

  function renderPanel({
    makeModel,
    transformModel,
    irisGridState,
    onPanelStateUpdate,
    loadPlugin = () => undefined,
  }: {
    makeModel: () => Promise<IrisGridModel>;
    transformModel?: (model: IrisGridModel) => any;
    /** Merged over the saved custom columns state */
    irisGridState?: Record<string, unknown>;
    onPanelStateUpdate?: (panelState: unknown) => void;
    loadPlugin?: (name: string) => any;
  }) {
    const panelState = makeCustomColumnsPanelState(['Foo = 1']);
    const props = {
      metadata: { table: 'table' } as any,
      glContainer: makeGlComponent() as unknown as Container,
      glEventHub: makeGlComponent() as any,
      user: TestUtils.REGULAR_USER,
      inputFilters: [],
      links: [],
      settings: { timeZone: 'America/New_York' } as any,
      panelState: {
        ...panelState,
        irisGridState: { ...panelState.irisGridState, ...irisGridState },
      } as any,
      loadPlugin,
      transformModel,
      onPanelStateUpdate,
    };
    const renderElement = (next: () => Promise<IrisGridModel>) => (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <IrisGridPanel makeModel={next} {...props} />
    );
    const result = render(renderElement(makeModel));
    return {
      ...result,
      rerenderWithMakeModel: (next: () => Promise<IrisGridModel>) =>
        result.rerender(renderElement(next)),
    };
  }

  function lastRenderedModel() {
    const { calls } = MockIrisGrid.mock;
    return calls[calls.length - 1]?.[0].model;
  }

  beforeEach(() => {
    MockIrisGrid.mockClear();
  });

  it('closes the model and skips the transform when unmounted while saved custom columns are pending', async () => {
    const { table } = makePendingCustomColumnsTable();
    const { makeModel, models } = makeTrackedMakeModel([table]);
    const transformModel = jest.fn(model => model);
    const { unmount } = renderPanel({ makeModel, transformModel });
    await waitFor(() => expect(table.applyCustomColumns).toHaveBeenCalled());

    unmount();

    await waitFor(() => expect(models[0].close).toHaveBeenCalledTimes(1));
    expect(transformModel).not.toHaveBeenCalled();
  });

  it('abandons a waiting load when makeModel changes', async () => {
    const first = makePendingCustomColumnsTable();
    const second = makePendingCustomColumnsTable();
    const { makeModel, models } = makeTrackedMakeModel([first.table]);
    const { makeModel: nextMakeModel, models: nextModels } =
      makeTrackedMakeModel([second.table]);
    const { rerenderWithMakeModel } = renderPanel({ makeModel });
    await waitFor(() =>
      expect(first.table.applyCustomColumns).toHaveBeenCalled()
    );

    rerenderWithMakeModel(nextMakeModel);
    await waitFor(() =>
      expect(second.table.applyCustomColumns).toHaveBeenCalled()
    );
    expect(models[0].close).toHaveBeenCalledTimes(1);

    act(() => second.fireCustomColumnsChanged());
    await waitFor(() => expect(lastRenderedModel()).toBe(nextModels[0]));
    expect(nextModels[0].close).not.toHaveBeenCalled();
  });

  it('shows the disconnected state during hydration and restarts on reconnect', async () => {
    const first = makePendingCustomColumnsTable();
    const second = makePendingCustomColumnsTable();
    const { makeModel, models } = makeTrackedMakeModel([
      first.table,
      second.table,
    ]);
    renderPanel({ makeModel });
    await waitFor(() =>
      expect(first.table.applyCustomColumns).toHaveBeenCalled()
    );

    act(() => {
      models[0].dispatchEvent(new CustomEvent(IrisGridModel.EVENT.DISCONNECT));
    });
    expect(await screen.findByText(/Table disconnected/)).toBeInTheDocument();
    expect(models[0].close).not.toHaveBeenCalled();

    act(() => {
      models[0].dispatchEvent(new CustomEvent(IrisGridModel.EVENT.RECONNECT));
    });
    await waitFor(() => expect(makeModel).toHaveBeenCalledTimes(2));
    expect(models[0].close).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(second.table.applyCustomColumns).toHaveBeenCalled()
    );

    act(() => second.fireCustomColumnsChanged());
    await waitFor(() => expect(lastRenderedModel()).toBe(models[1]));
    expect(screen.queryByText(/Table disconnected/)).not.toBeInTheDocument();
  });

  it('ignores a disconnect from a load abandoned during its transform', async () => {
    const first = makePendingCustomColumnsTable();
    const second = makePendingCustomColumnsTable();
    const { makeModel, models } = makeTrackedMakeModel([first.table]);
    const { makeModel: nextMakeModel, models: nextModels } =
      makeTrackedMakeModel([second.table]);
    const transformModel = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise(() => {
            // Never settles
          })
      )
      .mockImplementation(model => model);
    const { rerenderWithMakeModel } = renderPanel({
      makeModel,
      transformModel,
    });
    await waitFor(() =>
      expect(first.table.applyCustomColumns).toHaveBeenCalled()
    );
    act(() => first.fireCustomColumnsChanged());
    await waitFor(() => expect(transformModel).toHaveBeenCalledTimes(1));

    rerenderWithMakeModel(nextMakeModel);
    await waitFor(() =>
      expect(second.table.applyCustomColumns).toHaveBeenCalled()
    );
    act(() => {
      models[0].dispatchEvent(new CustomEvent(IrisGridModel.EVENT.DISCONNECT));
    });

    act(() => second.fireCustomColumnsChanged());
    await waitFor(() => expect(lastRenderedModel()).toBe(nextModels[0]));
    expect(screen.queryByText(/Table disconnected/)).not.toBeInTheDocument();
  });

  it('closes the previous model as soon as a reload starts', async () => {
    const first = makePendingCustomColumnsTable();
    const pending = makePendingCustomColumnsTable();
    const { makeModel, models } = makeTrackedMakeModel([first.table]);
    const { makeModel: nextMakeModel } = makeTrackedMakeModel([pending.table]);
    const { rerenderWithMakeModel } = renderPanel({ makeModel });
    await waitFor(() =>
      expect(first.table.applyCustomColumns).toHaveBeenCalled()
    );
    act(() => first.fireCustomColumnsChanged());
    await waitFor(() => expect(lastRenderedModel()).toBe(models[0]));

    rerenderWithMakeModel(nextMakeModel);
    await waitFor(() =>
      expect(pending.table.applyCustomColumns).toHaveBeenCalled()
    );

    expect(models[0].close).toHaveBeenCalledTimes(1);
  });

  it('saves pending grid state against the previous model when a reload starts', async () => {
    const first = makePendingCustomColumnsTable();
    const pending = makePendingCustomColumnsTable();
    const { makeModel, models } = makeTrackedMakeModel([first.table]);
    const { makeModel: nextMakeModel } = makeTrackedMakeModel([pending.table]);
    const onPanelStateUpdate = jest.fn();
    const { rerenderWithMakeModel } = renderPanel({
      makeModel,
      onPanelStateUpdate,
    });
    await waitFor(() =>
      expect(first.table.applyCustomColumns).toHaveBeenCalled()
    );
    act(() => first.fireCustomColumnsChanged());
    await waitFor(() => expect(lastRenderedModel()).toBe(models[0]));
    const { onStateChange } = MockIrisGrid.mock.calls[
      MockIrisGrid.mock.calls.length - 1
    ][0] as any;
    // Queues the debounced save
    act(() =>
      onStateChange(
        {
          advancedFilters: new Map(),
          aggregationSettings: { aggregations: [], showOnTop: false },
          customColumnFormatMap: new Map(),
          columnAlignmentMap: new Map(),
          isFilterBarShown: false,
          quickFilters: new Map(),
          // The save replaces the panel state the reload hydrates from
          customColumns: ['Foo = 1'],
          reverse: false,
          showSearchBar: false,
          searchValue: '',
          selectDistinctColumns: [],
          selectedSearchColumns: [],
          sorts: [],
          invertSearchColumns: false,
          pendingDataMap: new Map(),
          frozenColumns: [],
          conditionalFormats: [],
          columnHeaderGroups: [],
          metricCalculator: new IrisGridMetricCalculator(),
          metrics: { userColumnWidths: new Map(), userRowHeights: new Map() },
        },
        {
          isStuckToBottom: false,
          isStuckToRight: false,
          movedColumns: [],
          movedRows: [],
        }
      )
    );

    rerenderWithMakeModel(nextMakeModel);
    await waitFor(() =>
      expect(pending.table.applyCustomColumns).toHaveBeenCalled()
    );

    await waitFor(() => expect(onPanelStateUpdate).toHaveBeenCalledTimes(1));
  });

  it('does not save plugin state before the grid reports its state', async () => {
    const first = makePendingCustomColumnsTable();
    first.table.pluginName = 'TestPlugin';
    const pending = makePendingCustomColumnsTable();
    const { makeModel, models } = makeTrackedMakeModel([first.table]);
    const { makeModel: nextMakeModel } = makeTrackedMakeModel([pending.table]);
    const onPanelStateUpdate = jest.fn();
    const { rerenderWithMakeModel } = renderPanel({
      makeModel,
      onPanelStateUpdate,
      loadPlugin: () => jest.fn(() => null),
    });
    await waitFor(() =>
      expect(first.table.applyCustomColumns).toHaveBeenCalled()
    );
    act(() => first.fireCustomColumnsChanged());
    await waitFor(() => expect(lastRenderedModel()).toBe(models[0]));
    const { children: pluginContent } = MockIrisGrid.mock.calls[
      MockIrisGrid.mock.calls.length - 1
    ][0] as any;
    act(() => pluginContent.props.children.props.onStateChange({}));

    rerenderWithMakeModel(nextMakeModel);
    await waitFor(() =>
      expect(pending.table.applyCustomColumns).toHaveBeenCalled()
    );

    expect(onPanelStateUpdate).not.toHaveBeenCalled();
  });

  const transformedColumns = [{ name: '0' }] as any[];

  /**
   * Stand-in for a transform's returned model that records the hydration
   * setters it receives and reacts to each through `onSet`.
   */
  function makeTransformedModel(
    onSet: (name: string, model: IrisGridModel) => void,
    values: Record<string, unknown> = {}
  ) {
    const target = new EventTarget();
    const model = {
      originalColumns: transformedColumns,
      received: {} as Record<string, unknown>,
      close: jest.fn(),
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
    } as any;
    ['rollupConfig', 'selectDistinctColumns'].forEach(name => {
      Object.defineProperty(model, name, {
        get: () => values[name],
        set: value => {
          model.received[name] = value;
          onSet(name, model);
        },
      });
    });
    return model;
  }

  const rollupState = {
    rollupConfig: { columns: ['0'] },
    aggregationSettings: { aggregations: [], showOnTop: false },
    selectDistinctColumns: ['0'],
  };

  it('applies rollup and select distinct to the transformed model after the transform', async () => {
    const { table, fireCustomColumnsChanged } = makePendingCustomColumnsTable();
    const { makeModel } = makeTrackedMakeModel([table]);
    const steps: string[] = [];
    table.applyCustomColumns.mockImplementation(customColumns => {
      steps.push('customColumns');
      return customColumns;
    });
    const transformed = makeTransformedModel((name, model) => {
      steps.push(name);
      if (name === 'rollupConfig') {
        setTimeout(() =>
          model.dispatchEvent(
            new CustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED)
          )
        );
      }
    });
    const transformModel = jest.fn(() => {
      steps.push('transform');
      return transformed;
    });
    renderPanel({ makeModel, transformModel, irisGridState: rollupState });
    await waitFor(() => expect(table.applyCustomColumns).toHaveBeenCalled());

    act(() => fireCustomColumnsChanged());

    await waitFor(() =>
      expect(steps).toEqual([
        'customColumns',
        'transform',
        'rollupConfig',
        'selectDistinctColumns',
      ])
    );
  });

  it('hydrates a rollup saved without the default aggregation settings', async () => {
    const { makeModel } = makeTrackedMakeModel([makeTable()]);
    const transformed = makeTransformedModel((name, model) => {
      setTimeout(() =>
        model.dispatchEvent(
          new CustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED)
        )
      );
    });
    renderPanel({
      makeModel,
      transformModel: () => transformed,
      // Slim state omits values equal to the defaults
      irisGridState: {
        customColumns: undefined,
        rollupConfig: { columns: ['0'] },
      },
    });

    await waitFor(() => expect(lastRenderedModel()).toBe(transformed));
    expect(transformed.received).toEqual({
      rollupConfig: IrisGridUtils.getModelRollupConfig(
        transformedColumns,
        { columns: ['0'] } as any,
        { aggregations: [], showOnTop: false }
      ),
    });
  });

  it('skips rollup and select distinct the transform already restored', async () => {
    const { table, fireCustomColumnsChanged } = makePendingCustomColumnsTable();
    const { makeModel } = makeTrackedMakeModel([table]);
    // Setters that ignore an equal value never emit COLUMNS_CHANGED
    const onSet = jest.fn();
    const transformed = makeTransformedModel(onSet, {
      rollupConfig: IrisGridUtils.getModelRollupConfig(
        transformedColumns,
        rollupState.rollupConfig as any,
        rollupState.aggregationSettings as any
      ),
      selectDistinctColumns: [...rollupState.selectDistinctColumns],
    });
    renderPanel({
      makeModel,
      transformModel: () => transformed,
      irisGridState: rollupState,
    });
    await waitFor(() => expect(table.applyCustomColumns).toHaveBeenCalled());

    act(() => fireCustomColumnsChanged());

    await waitFor(() => expect(lastRenderedModel()).toBe(transformed));
    expect(onSet).not.toHaveBeenCalled();
  });

  it('skips select distinct when no saved column exists on the source', async () => {
    const { table, fireCustomColumnsChanged } = makePendingCustomColumnsTable();
    const { makeModel } = makeTrackedMakeModel([table]);
    // The real setter swaps to the unchanged original model and never emits
    // COLUMNS_CHANGED
    const onSet = jest.fn();
    const transformed = makeTransformedModel(onSet, {
      selectDistinctColumns: [],
    });
    renderPanel({
      makeModel,
      transformModel: () => transformed,
      irisGridState: { selectDistinctColumns: ['Gone'] },
    });
    await waitFor(() => expect(table.applyCustomColumns).toHaveBeenCalled());

    act(() => fireCustomColumnsChanged());

    await waitFor(() => expect(lastRenderedModel()).toBe(transformed));
    expect(onSet).not.toHaveBeenCalled();
  });

  it('shows a load error and closes the transformed model if the rollup fails', async () => {
    const { table, fireCustomColumnsChanged } = makePendingCustomColumnsTable();
    const { makeModel } = makeTrackedMakeModel([table]);
    const onSet = jest.fn((name: string, model: IrisGridModel) => {
      setTimeout(() =>
        model.dispatchEvent(
          new CustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
            detail: new Error('Rollup failed'),
          })
        )
      );
    });
    const transformed = makeTransformedModel(onSet);
    renderPanel({
      makeModel,
      transformModel: () => transformed,
      irisGridState: rollupState,
    });
    await waitFor(() => expect(table.applyCustomColumns).toHaveBeenCalled());

    act(() => fireCustomColumnsChanged());

    expect(
      await screen.findByText('Unable to open table. Error: Rollup failed')
    ).toBeInTheDocument();
    expect(transformed.close).toHaveBeenCalledTimes(1);
    expect(onSet).toHaveBeenCalledTimes(1);
    expect(onSet).toHaveBeenCalledWith('rollupConfig', transformed);
    expect(MockIrisGrid).not.toHaveBeenCalled();
  });
});
