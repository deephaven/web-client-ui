/* eslint func-names: "off" */
import React from 'react';
import { render, screen } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { MockChartModel } from '@deephaven/chart';
import { ChartPanel } from './ChartPanel';
import ChartColumnSelectorOverlay from './ChartColumnSelectorOverlay';

const DASHBOARD_ID = 'TEST_DASHBOARD_ID';
const PANEL_ID = 'TEST_PANEL_ID';

jest.mock('@deephaven/chart', () => {
  const MockReact = jest.requireActual('react');
  return {
    ...jest.requireActual('@deephaven/chart'),
    Chart: MockReact.forwardRef(() => null),
  };
});

jest.mock('@deephaven/dashboard', () => ({
  ...jest.requireActual('@deephaven/dashboard'),
  LayoutUtils: {
    getIdFromPanel: jest.fn(() => 'TEST_PANEL_ID'),
    getTitleFromContainer: jest.fn(() => 'TEST_PANEL_TITLE'),
  },
}));

// Disable CSSTransition delays to make testing simpler
jest.mock('react-transition-group', () => ({
  // eslint-disable-next-line react/display-name, react/prop-types
  Transition: ({ children, in: inProp }) => <>{inProp ? children : null}</>,
  // eslint-disable-next-line react/display-name, react/prop-types
  CSSTransition: ({ children, in: inProp }) => <>{inProp ? children : null}</>,
}));

const MockChart = jest.fn(() => null);

jest.mock('@deephaven/chart', () => ({
  ...jest.requireActual('@deephaven/chart'),
  __esModule: true,
  // eslint-disable-next-line react/jsx-props-no-spreading
  Chart: jest.fn(props => <MockChart {...props} />),
  default: jest.fn(),
}));

function makeGlComponent() {
  return { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
}

function makeTable() {
  const table = new dh.Table();
  const { addEventListener, removeEventListener } = table;
  table.addEventListener = jest.fn(addEventListener);
  table.removeEventListener = jest.fn(removeEventListener);
  return table;
}

function makeGridPanel() {
  return {
    props: { inputFilters: [] },
    state: { panelState: null },
  };
}

function makeChartPanelWrapper({
  glContainer = makeGlComponent(),
  glEventHub = makeGlComponent(),
  client = new dh.Client({}),
  columnSelectionValidator = null,
  makeModel = () => Promise.resolve(new MockChartModel()),
  metadata = { figure: 'testFigure' },
  inputFilters = [],
  links = [],
  localDashboardId = DASHBOARD_ID,
  isLinkerActive = false,
  setActiveTool = jest.fn(),
  setDashboardIsolatedLinkerPanelId = jest.fn(),
  source = makeTable(),
  sourcePanel = makeGridPanel(),
} = {}) {
  return (
    <ChartPanel
      client={client}
      columnSelectionValidator={columnSelectionValidator}
      makeModel={makeModel}
      metadata={metadata}
      glContainer={glContainer}
      glEventHub={glEventHub}
      inputFilters={inputFilters}
      links={links}
      localDashboardId={localDashboardId}
      isLinkerActive={isLinkerActive}
      setActiveTool={setActiveTool}
      setDashboardIsolatedLinkerPanelId={setDashboardIsolatedLinkerPanelId}
      source={source}
      sourcePanel={sourcePanel}
    />
  );
}

function callUpdateFunction() {
  MockChart.mock.calls[MockChart.mock.calls.length - 1][0].onUpdate();
}

function callErrorFunction() {
  MockChart.mock.calls[MockChart.mock.calls.length - 1][0].onError();
}

function expectLoading() {
  expect(screen.getAllByRole('img', { hidden: true }).length).toBe(2);
}

function expectNotLoading() {
  expect(screen.queryByRole('img', { hidden: true })).toBeNull();
}

function checkPanelOverlays({
  container,
  isLoading = false,
  isSelectingColumn = false,
  isWaitingForInput = false,
  waitingFilters = 0,
  waitingFiltersInvalid = 0,
} = {}) {
  const isPromptShown = isWaitingForInput || waitingFilters > 0;
  if (isLoading) {
    expectLoading();
  }
  expect(
    container.querySelectorAll('.chart-column-selector-overlay').length
  ).toBe(isSelectingColumn ? 1 : 0);
  expect(container.querySelectorAll('.chart-filter-overlay').length).toBe(
    isPromptShown ? 1 : 0
  );
  expect(container.querySelectorAll('.chart-filter-waiting-input').length).toBe(
    isWaitingForInput ? 1 : 0
  );
  expect(
    container.querySelectorAll('.chart-filter-waiting-filter').length
  ).toBe(waitingFilters > 0 ? 1 : 0);
  expect(container.querySelectorAll('.waiting-filter-item').length).toBe(
    waitingFilters
  );
  expect(
    container.querySelectorAll('.waiting-filter-item.is-invalid').length
  ).toBe(waitingFiltersInvalid);
}

it('mounts/unmounts without crashing', () => {
  render(makeChartPanelWrapper());
});

it('unmounts while still resolving the model successfully', async () => {
  const model = new MockChartModel();
  let modelResolve = null;
  const modelPromise = new Promise(resolve => {
    modelResolve = resolve;
  });

  const { unmount } = render(makeChartPanelWrapper());
  unmount();

  modelResolve(model);

  await expect(modelPromise).resolves.toBe(model);
});

it('handles a model passed in as a promise, and shows the loading spinner until it is loaded and an event is received', async () => {
  const model = new MockChartModel();
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  render(makeChartPanelWrapper({ makeModel }));
  expectLoading();

  await expect(modelPromise).resolves.toBe(model);

  expect(MockChart).toHaveBeenLastCalledWith(
    expect.objectContaining({ model }),
    expect.objectContaining({})
  );

  expectLoading();
  callUpdateFunction();

  expectNotLoading();
});

it('shows an error properly if model loading fails', async () => {
  const error = new Error('TEST ERROR MESSAGE');
  const modelPromise = Promise.reject(error);
  const makeModel = () => modelPromise;

  render(makeChartPanelWrapper({ makeModel }));

  await expect(modelPromise).rejects.toThrow(error);

  expect(
    screen.getByText('Unable to open chart. Error: TEST ERROR MESSAGE')
  ).toBeTruthy();
  const warning = screen.getByRole('img', { hidden: true });
  expect(warning).toBeTruthy();
});

it('shows a prompt if input filters are required, and removes when they are set', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const { rerender } = render(makeChartPanelWrapper({ makeModel }));

  await expect(modelPromise).resolves.toBe(model);

  callUpdateFunction();
  const prompt =
    'This plot requires a filter control to be added to the layout or a table link to be created on the following columns:';
  expect(screen.getByText(prompt)).toBeTruthy();
  expectLoading();

  rerender(
    makeChartPanelWrapper({
      makeModel,
      inputFilters: filterFields.map(name => ({
        name,
        type: 'java.lang.String',
        value: '',
      })),
    })
  );

  expect(screen.getByText('Waiting for User Input')).toBeTruthy();

  rerender(
    makeChartPanelWrapper({
      makeModel,
      inputFilters: filterFields.map(name => ({
        name,
        type: 'java.lang.String',
        value: 'Test',
      })),
    })
  );

  expectLoading();

  // Loading spinner should be shown until the update event is received
  callUpdateFunction();
  expectNotLoading();
});

it('shows loading spinner until an error is received', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  render(
    makeChartPanelWrapper({
      makeModel,
      inputFilters: filterFields.map(name => ({
        name,
        type: 'java.lang.String',
        value: 'Test',
      })),
    })
  );

  await expect(modelPromise).resolves.toBe(model);

  // Overlays shouldn't appear yet because we haven't received an update or error event, should just see loading
  expectLoading();

  // Loading spinner should be shown until the error event is received
  callErrorFunction();

  expect(screen.queryByRole('img')).toBeNull();
});

it('shows prompt if input filters are removed', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const inputFilters = filterFields.map(name => ({
    name,
    type: 'java.lang.String',
    value: 'Test',
  }));
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const { rerender, container } = render(
    makeChartPanelWrapper({ makeModel, inputFilters })
  );

  await expect(modelPromise).resolves.toBe(model);

  expectLoading();

  // Loading spinner should be shown until the update event is received
  callUpdateFunction();

  expectNotLoading();

  // Delete an input filter
  rerender(
    makeChartPanelWrapper({
      makeModel,
      inputFilters: [inputFilters[0]],
    })
  );

  checkPanelOverlays({
    container,
    isWaitingForInput: false,
    waitingFilters: 2,
    waitingFiltersInvalid: 1,
  });
});

it('shows prompt if input filters are cleared', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const inputFilters = filterFields.map(name => ({
    name,
    type: 'java.lang.String',
    value: 'Test',
  }));
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const { rerender, container } = render(
    makeChartPanelWrapper({ makeModel, inputFilters })
  );

  await expect(modelPromise).resolves.toBe(model);

  callUpdateFunction();

  // Clear an input filter
  const updatedFilters = [...inputFilters];
  updatedFilters[0] = { ...updatedFilters[0], value: '' };

  rerender(makeChartPanelWrapper({ makeModel, inputFilters: updatedFilters }));

  checkPanelOverlays({
    container,
    isLoading: false,
    isWaitingForInput: true,
  });
});

it('shows loading spinner until an error is received', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const { container } = render(
    makeChartPanelWrapper({
      makeModel,
      inputFilters: filterFields.map(name => ({
        name,
        type: 'java.lang.String',
        value: 'Test',
      })),
    })
  );

  await expect(modelPromise).resolves.toBe(model);

  // Overlays shouldn't appear yet because we haven't received an update or error event, should just see loading
  checkPanelOverlays({ container, isLoading: true });

  // Loading spinner should be shown until the error event is received
  callErrorFunction();

  checkPanelOverlays({ container, isLoading: false });
});

describe('linker column selection', () => {
  it('does not show overlay if linker active but no filterable columns', async () => {
    const model = new MockChartModel();
    const modelPromise = Promise.resolve(model);
    const makeModel = () => modelPromise;

    const { container } = render(
      makeChartPanelWrapper({
        makeModel,
        columnSelectionValidator: () => true,
      })
    );

    await expect(modelPromise).resolves.toBe(model);

    callUpdateFunction();

    checkPanelOverlays({ container, isLoading: false });
  });

  it('shows the column selector if linker active and filterable columns', async () => {
    const columnNames = ['Field_A', 'Field_B', 'Field_C'];
    const disabledColumnNames = [];
    const columnSelectionValidator = (panel, column) =>
      disabledColumnNames.find(
        disabledColumn => disabledColumn === column.name
      ) == null;
    const model = new MockChartModel({
      filterFields: columnNames,
    });
    const modelPromise = Promise.resolve(model);
    const makeModel = () => modelPromise;

    const { rerender, container } = render(
      makeChartPanelWrapper({
        makeModel,
        columnSelectionValidator,
        isLinkerActive: true,
      })
    );

    await expect(modelPromise).resolves.toBe(model);

    callUpdateFunction();

    checkPanelOverlays({ container, isSelectingColumn: true });

    expect(container.querySelectorAll('.btn-socketed').length).toBe(
      columnNames.length
    );

    expect(screen.getByText('Field_C').closest('button')).not.toBeDisabled();

    expect(container.querySelectorAll('.btn-socketed-linked').length).toBe(0);

    disabledColumnNames.push(columnNames[2]);

    rerender(
      makeChartPanelWrapper({
        makeModel,
        columnSelectionValidator,
        isLinkerActive: true,
        links: [
          {
            id: 'TEST_LINK',
            start: {
              panelId: 'DIFFERENT_PANEL',
              columnName: 'Column',
              columnType: 'java.lang.String',
            },
            end: {
              panelId: PANEL_ID,
              columnName: columnNames[1],
              columnType: 'java.lang.String',
            },
          },
        ],
      })
    );

    checkPanelOverlays({ container, isSelectingColumn: true });
    expect(container.querySelectorAll('.btn-socketed-linked').length).toBe(1);
    expect(
      container.querySelectorAll(
        `.btn-socketed-linked.${ChartColumnSelectorOverlay.makeButtonClassName(
          columnNames[0]
        )}`
      ).length
    ).toBe(0);
    expect(
      container.querySelectorAll(
        `.btn-socketed-linked.${ChartColumnSelectorOverlay.makeButtonClassName(
          columnNames[1]
        )}`
      ).length
    ).toBe(1);
    expect(
      container.querySelectorAll(
        `.btn-socketed-linked.${ChartColumnSelectorOverlay.makeButtonClassName(
          columnNames[2]
        )}`
      ).length
    ).toBe(0);
    expect(screen.getByText('Field_C').closest('button')).toBeDisabled();
  });
});

it('adds listeners to the source table when passed in and linked', async () => {
  const model = new MockChartModel();
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const { rerender } = render(
    makeChartPanelWrapper({
      makeModel,
      metadata: { settings: { isLinked: true } },
      source: null,
      sourcePanel: null,
    })
  );

  await expect(modelPromise).resolves.toBe(model);

  const source = makeTable();

  rerender(
    makeChartPanelWrapper({
      makeModel,
      metadata: { settings: { isLinked: true } },
      source,
      sourcePanel: null,
    })
  );

  expect(source.addEventListener.mock.calls.length).toBe(3);
  expect([
    source.addEventListener.mock.calls[0][0],
    source.addEventListener.mock.calls[1][0],
    source.addEventListener.mock.calls[2][0],
  ]).toEqual(
    expect.arrayContaining([
      dh.Table.EVENT_CUSTOMCOLUMNSCHANGED,
      dh.Table.EVENT_FILTERCHANGED,
      dh.Table.EVENT_SORTCHANGED,
    ])
  );
});
