/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint func-names: "off" */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { IrisGridModel, IrisGridModelFactory } from '@deephaven/iris-grid';
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
  transformModel: ((model: any) => any) | undefined = undefined,
  panelState: any = undefined
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
      panelState={panelState}
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

describe('persisted custom columns hydration', () => {
  function makePanelState(customColumns: readonly string[]) {
    return {
      gridState: {},
      irisGridState: { customColumns },
      irisGridPanelState: {},
    } as any;
  }

  function renderPanel({
    makeModel,
    transformModel,
    panelState,
  }: {
    makeModel: () => any;
    transformModel?: (model: any) => any;
    panelState?: any;
  }) {
    return makeIrisGridPanelWrapper(
      makeModel,
      ...Array(10).fill(undefined),
      transformModel,
      panelState
    );
  }

  /**
   * The mock table's `applyCustomColumns` doesn't emit the custom columns
   * event, so fire it to let the model emit `COLUMNS_CHANGED`.
   */
  function stubApplyCustomColumns(table: any): jest.Mock {
    const applied = jest.fn((customColumns: readonly string[]) => {
      table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED);
      return customColumns;
    });
    // eslint-disable-next-line no-param-reassign
    table.applyCustomColumns = applied;
    return applied;
  }

  beforeEach(() => {
    MockIrisGrid.mockClear();
  });

  it('waits for the custom columns schema update before transformModel runs', async () => {
    const table = makeTable();
    const customColumns = ['C=0*2'];
    // Server applies custom columns asynchronously; the event is fired
    // manually below so the test controls when the schema updates.
    const applyCustomColumns = jest.fn((cc: readonly string[]) => cc);
    table.applyCustomColumns = applyCustomColumns;
    let transformedColumnNames: string[] | undefined;
    const transformModel = jest.fn((model: any) => {
      transformedColumnNames = model.columns.map((c: any) => c.name);
      return model;
    });

    await act(async () => {
      renderPanel({
        makeModel: makeMakeModel(table),
        transformModel,
        panelState: makePanelState(customColumns),
      });
    });
    await waitFor(() =>
      expect(applyCustomColumns).toHaveBeenCalledWith(customColumns)
    );

    expect(transformModel).not.toHaveBeenCalled();
    expect(MockIrisGrid).not.toHaveBeenCalled();

    await act(async () => {
      table.columns = [
        ...table.columns,
        new (dh as any).Column({ index: 1, name: 'C' }),
      ];
      table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED);
    });
    await waitFor(() => expect(MockIrisGrid).toHaveBeenCalled());

    expect(transformModel).toHaveBeenCalledTimes(1);
    expect(transformedColumnNames).toEqual(['0', 'C']);
    expect(applyCustomColumns).toHaveBeenCalledTimes(1);
  });

  it('does not write custom columns when none are persisted', async () => {
    const table = makeTable();
    const applyCustomColumns = stubApplyCustomColumns(table);

    await act(async () => {
      renderPanel({
        makeModel: makeMakeModel(table),
        panelState: makePanelState([]),
      });
    });
    await waitFor(() => expect(MockIrisGrid).toHaveBeenCalled());

    expect(applyCustomColumns).not.toHaveBeenCalled();
  });

  it('skips persisted custom columns when the model does not support them', async () => {
    const table = makeTable();
    const applyCustomColumns = stubApplyCustomColumns(table);
    const makeModel = async () => {
      const model = await makeMakeModel(table)();
      Object.defineProperty(model, 'isCustomColumnsAvailable', {
        get: () => false,
      });
      return model;
    };

    await act(async () => {
      renderPanel({
        makeModel,
        panelState: makePanelState(['C=0*2']),
      });
    });
    await waitFor(() => expect(MockIrisGrid).toHaveBeenCalled());

    expect(applyCustomColumns).not.toHaveBeenCalled();
  });

  it('shows an error when applying custom columns fails', async () => {
    const table = makeTable();
    const error = new Error('Bad custom column expression');
    let model: any;
    table.applyCustomColumns = jest.fn((cc: readonly string[]) => {
      model.dispatchEvent(
        new CustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, { detail: error })
      );
      return cc;
    });
    // The proxy model's `close()` closes the source table.
    table.close = jest.fn();
    const makeModel = async () => {
      model = await makeMakeModel(table)();
      return model;
    };
    const transformModel = jest.fn((m: any) => m);

    const { container } = renderPanel({
      makeModel,
      transformModel,
      panelState: makePanelState(['C=bad(']),
    });
    await waitFor(() =>
      expect(
        screen.getByText(
          'Unable to open table. Error: Bad custom column expression'
        )
      ).toBeTruthy()
    );
    await expectNotLoading(container);

    expect(transformModel).not.toHaveBeenCalled();
    expect(table.close).toHaveBeenCalledTimes(1);
    expect(MockIrisGrid).not.toHaveBeenCalled();
  });

  it('shows the disconnected state during hydration and resumes after reconnect', async () => {
    const table = makeTable();
    let model: any;
    table.applyCustomColumns = jest.fn((cc: readonly string[]) => {
      model.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.DISCONNECT));
      return cc;
    });
    table.close = jest.fn();
    const makeModel = async () => {
      model = await makeMakeModel(table)();
      return model;
    };
    const transformModel = jest.fn((m: any) => m);

    renderPanel({
      makeModel,
      transformModel,
      panelState: makePanelState(['C=0*2']),
    });
    const disconnectedMessage =
      'Unable to open table. Error: Table disconnected';
    await waitFor(() =>
      expect(screen.getByText(disconnectedMessage)).toBeTruthy()
    );
    expect(transformModel).not.toHaveBeenCalled();
    expect(table.close).not.toHaveBeenCalled();

    act(() => {
      model.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.RECONNECT));
    });
    expect(screen.queryByText(disconnectedMessage)).toBeNull();

    act(() => {
      table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED);
    });
    await waitFor(() => expect(MockIrisGrid).toHaveBeenCalled());
    expect(transformModel).toHaveBeenCalledTimes(1);
    expect(table.close).not.toHaveBeenCalled();
  });

  it('cleans up a pending hydration when the load is canceled', async () => {
    const table = makeTable();
    const applyCustomColumns = jest.fn((cc: readonly string[]) => cc);
    table.applyCustomColumns = applyCustomColumns;
    table.close = jest.fn();
    let model: any;
    const makeModel = async () => {
      model = await makeMakeModel(table)();
      jest.spyOn(model, 'removeEventListener');
      return model;
    };
    const transformModel = jest.fn((m: any) => m);

    const { unmount } = renderPanel({
      makeModel,
      transformModel,
      panelState: makePanelState(['C=0*2']),
    });
    await waitFor(() => expect(applyCustomColumns).toHaveBeenCalled());

    unmount();
    await waitFor(() => expect(table.close).toHaveBeenCalledTimes(1));
    expect(model.removeEventListener).toHaveBeenCalledWith(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      expect.any(Function)
    );

    table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED);
    await act(() => Promise.resolve());
    expect(transformModel).not.toHaveBeenCalled();
  });

  it('skips hydration when canceled before the model resolves', async () => {
    const table = makeTable();
    const applyCustomColumns = stubApplyCustomColumns(table);
    table.close = jest.fn();
    let resolveTable: (t: unknown) => void = () => undefined;
    const tablePromise = new Promise(resolve => {
      resolveTable = resolve;
    });
    const transformModel = jest.fn((m: any) => m);

    const { unmount } = renderPanel({
      makeModel: makeMakeModel(tablePromise),
      transformModel,
      panelState: makePanelState(['C=0*2']),
    });
    unmount();
    resolveTable(table);

    await waitFor(() => expect(table.close).toHaveBeenCalledTimes(1));
    expect(applyCustomColumns).not.toHaveBeenCalled();
    expect(transformModel).not.toHaveBeenCalled();
  });

  it('does not start the transform when canceled as hydration completes', async () => {
    const table = makeTable();
    table.close = jest.fn();
    let model: any;
    let unmount: () => void = () => undefined;
    table.applyCustomColumns = jest.fn((cc: readonly string[]) => {
      // Registered after the hydration listener, so the load is canceled after
      // hydration resolves but before the transform starts.
      model.addEventListener(IrisGridModel.EVENT.COLUMNS_CHANGED, () =>
        unmount()
      );
      table.fireEvent((dh as any).Table.EVENT_CUSTOMCOLUMNSCHANGED);
      return cc;
    });
    const makeModel = async () => {
      model = await makeMakeModel(table)();
      return model;
    };
    const transformModel = jest.fn((m: any) => m);

    ({ unmount } = renderPanel({
      makeModel,
      transformModel,
      panelState: makePanelState(['C=0*2']),
    }));

    await waitFor(() => expect(table.close).toHaveBeenCalledTimes(1));
    expect(transformModel).not.toHaveBeenCalled();
  });
});
