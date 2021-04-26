/* eslint func-names: "off" */
import React from 'react';
import { mount } from 'enzyme';
import dh from '@deephaven/jsapi-shim';
import { ChartPanel } from './ChartPanel';
import MockChartModel from '../../chart/MockChartModel';
import ChartColumnSelectorOverlay from './ChartColumnSelectorOverlay';
import Chart from '../../chart/Chart';

const DASHBOARD_ID = 'TEST_DASHBOARD_ID';
const PANEL_ID = 'TEST_PANEL_ID';

jest.mock('../../chart/Chart');
jest.mock('../../layout/LayoutUtils', () => ({
  getIdFromPanel: jest.fn(() => 'TEST_PANEL_ID'),
  getTitleFromContainer: jest.fn(() => 'TEST_PANEL_TITLE'),
}));
// Disable CSSTransition delays to make testing simpler
jest.mock('react-transition-group', () => ({
  // eslint-disable-next-line react/display-name, react/prop-types
  Transition: ({ children, in: inProp }) => <>{inProp ? children : null}</>,
  // eslint-disable-next-line react/display-name, react/prop-types
  CSSTransition: ({ children, in: inProp }) => <>{inProp ? children : null}</>,
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
  return mount(
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

function checkPanelOverlays({
  wrapper,
  isLoading = false,
  isSelectingColumn = false,
  isWaitingForInput = false,
  waitingFilters = 0,
  waitingFiltersInvalid = 0,
} = {}) {
  const isPromptShown = isWaitingForInput || waitingFilters > 0;
  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(isLoading);
  expect(wrapper.find('.chart-column-selector-overlay').length).toBe(
    isSelectingColumn ? 1 : 0
  );
  expect(wrapper.find('.chart-filter-overlay').length).toBe(
    isPromptShown ? 1 : 0
  );
  expect(wrapper.find('.chart-filter-waiting-input').length).toBe(
    isWaitingForInput ? 1 : 0
  );
  expect(wrapper.find('.chart-filter-waiting-filter').length).toBe(
    waitingFilters > 0 ? 1 : 0
  );
  expect(wrapper.find('.waiting-filter-item').length).toBe(waitingFilters);
  expect(wrapper.find('.waiting-filter-item.is-invalid').length).toBe(
    waitingFiltersInvalid
  );
}

it('mounts/unmounts without crashing', () => {
  const wrapper = makeChartPanelWrapper();
  wrapper.unmount();
});

it('unmounts while still resolving the model successfully', async () => {
  const model = new MockChartModel();
  let modelResolve = null;
  const modelPromise = new Promise(resolve => {
    modelResolve = resolve;
  });

  const wrapper = makeChartPanelWrapper();
  const setState = jest.fn();
  wrapper.instance().setState = setState;
  wrapper.unmount();

  modelResolve(model);

  await expect(modelPromise).resolves.toBe(model);

  expect(setState).not.toHaveBeenCalled();
});

it('handles a model passed in as a promise, and shows the loading spinner until it is loaded and an event is received', async () => {
  const model = new MockChartModel();
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const wrapper = makeChartPanelWrapper({ makeModel });

  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(true);

  await expect(modelPromise).resolves.toBe(model);
  wrapper.update();

  expect(wrapper.state('model')).toBe(model);
  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(true);

  // Loading spinner should be shown until the update event is received
  wrapper.find(Chart).prop('onUpdate')();
  wrapper.update();

  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(false);
});

it('shows an error properly if model loading fails', async () => {
  const error = new Error('TEST ERROR MESSAGE');
  const modelPromise = Promise.reject(error);
  const makeModel = () => modelPromise;

  const wrapper = makeChartPanelWrapper({ makeModel });

  await expect(modelPromise).rejects.toThrow(error);

  wrapper.update();

  expect(wrapper.state('error')).toBe(error);
  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(false);
  expect(wrapper.find('LoadingOverlay').prop('errorMessage')).not.toBe(null);
});

it('shows a prompt if input filters are required, and removes when they are set', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const wrapper = makeChartPanelWrapper({ makeModel });

  await expect(modelPromise).resolves.toBe(model);
  wrapper.update();

  wrapper.find(Chart).prop('onUpdate')();
  wrapper.update();

  checkPanelOverlays({ wrapper, waitingFilters: 2, waitingFiltersInvalid: 2 });

  wrapper.setProps({
    inputFilters: filterFields.map(name => ({
      name,
      type: 'java.lang.String',
      value: '',
    })),
  });

  wrapper.update();
  checkPanelOverlays({ wrapper, isWaitingForInput: true });

  wrapper.setProps({
    inputFilters: filterFields.map(name => ({
      name,
      type: 'java.lang.String',
      value: 'Test',
    })),
  });
  wrapper.update();

  checkPanelOverlays({ wrapper, isLoading: true });

  // Loading spinner should be shown until the update event is received
  wrapper.find(Chart).prop('onUpdate')();
  wrapper.update();

  checkPanelOverlays({ wrapper, isLoading: false });
});

it('shows loading spinner until an error is received', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const wrapper = makeChartPanelWrapper({
    makeModel,
    inputFilters: filterFields.map(name => ({
      name,
      type: 'java.lang.String',
      value: 'Test',
    })),
  });

  await expect(modelPromise).resolves.toBe(model);

  wrapper.update();

  // Overlays shouldn't appear yet because we haven't received an update or error event, should just see loading
  checkPanelOverlays({ wrapper, isLoading: true });

  // Loading spinner should be shown until the error event is received
  wrapper.find(Chart).prop('onError')();
  wrapper.update();

  checkPanelOverlays({ wrapper, isLoading: false });
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

  const wrapper = makeChartPanelWrapper({ makeModel, inputFilters });

  await expect(modelPromise).resolves.toBe(model);
  wrapper.update();

  checkPanelOverlays({ wrapper, isLoading: true });

  // Loading spinner should be shown until the update event is received
  wrapper.find(Chart).prop('onUpdate')();
  wrapper.update();

  checkPanelOverlays({ wrapper, isLoading: false });

  // Delete an input filter
  wrapper.setProps({
    inputFilters: [inputFilters[0]],
  });
  wrapper.update();

  checkPanelOverlays({
    wrapper,
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

  const wrapper = makeChartPanelWrapper({ makeModel, inputFilters });

  await expect(modelPromise).resolves.toBe(model);
  wrapper.update();

  wrapper.find(Chart).prop('onUpdate')();
  wrapper.update();

  // Clear an input filter
  const updatedFilters = [...inputFilters];
  updatedFilters[0] = { ...updatedFilters[0], value: '' };
  wrapper.setProps({
    inputFilters: updatedFilters,
  });
  wrapper.update();

  checkPanelOverlays({
    wrapper,
    isLoading: false,
    isWaitingForInput: true,
  });
});

it('shows loading spinner until an error is received', async () => {
  const filterFields = ['Field_A', 'Field_B'];
  const model = new MockChartModel({ filterFields });
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const wrapper = makeChartPanelWrapper({
    makeModel,
    inputFilters: filterFields.map(name => ({
      name,
      type: 'java.lang.String',
      value: 'Test',
    })),
  });

  await expect(modelPromise).resolves.toBe(model);

  wrapper.update();

  // Overlays shouldn't appear yet because we haven't received an update or error event, should just see loading
  checkPanelOverlays({ wrapper, isLoading: true });

  // Loading spinner should be shown until the error event is received
  wrapper.find(Chart).prop('onError')();
  wrapper.update();

  checkPanelOverlays({ wrapper, isLoading: false });
});

describe('linker column selection', () => {
  it('does not show overlay if linker active but no filterable columns', async () => {
    const model = new MockChartModel();
    const modelPromise = Promise.resolve(model);
    const makeModel = () => modelPromise;

    const wrapper = makeChartPanelWrapper({
      makeModel,
      columnSelectionValidator: () => true,
    });

    await expect(modelPromise).resolves.toBe(model);
    wrapper.update();

    wrapper.find(Chart).prop('onUpdate')();
    wrapper.update();

    checkPanelOverlays({ wrapper, isLoading: false });
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

    const wrapper = makeChartPanelWrapper({
      makeModel,
      columnSelectionValidator,
      isLinkerActive: true,
    });

    await expect(modelPromise).resolves.toBe(model);
    wrapper.update();

    wrapper.find(Chart).prop('onUpdate')();
    wrapper.update();

    checkPanelOverlays({ wrapper, isSelectingColumn: true });
    expect(wrapper.find('.btn-socketed').length).toBe(columnNames.length);
    expect(
      wrapper
        .find(
          `.btn-socketed.${ChartColumnSelectorOverlay.makeButtonClassName(
            columnNames[2]
          )}`
        )
        .props().disabled
    ).not.toBeTruthy();
    expect(wrapper.find('.btn-socketed-linked').length).toBe(0);

    disabledColumnNames.push(columnNames[2]);
    wrapper.setProps({
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
    });

    wrapper.update();
    checkPanelOverlays({ wrapper, isSelectingColumn: true });
    expect(wrapper.find('.btn-socketed-linked').length).toBe(1);
    expect(
      wrapper.find(
        `.btn-socketed-linked.${ChartColumnSelectorOverlay.makeButtonClassName(
          columnNames[0]
        )}`
      ).length
    ).toBe(0);
    expect(
      wrapper.find(
        `.btn-socketed-linked.${ChartColumnSelectorOverlay.makeButtonClassName(
          columnNames[1]
        )}`
      ).length
    ).toBe(1);
    expect(
      wrapper.find(
        `.btn-socketed-linked.${ChartColumnSelectorOverlay.makeButtonClassName(
          columnNames[2]
        )}`
      ).length
    ).toBe(0);
    expect(
      wrapper
        .find(
          `.btn-socketed.${ChartColumnSelectorOverlay.makeButtonClassName(
            columnNames[2]
          )}`
        )
        .props().disabled
    ).toBeTruthy();
  });
});

it('adds listeners to the source table when passed in and linked', async () => {
  const model = new MockChartModel();
  const modelPromise = Promise.resolve(model);
  const makeModel = () => modelPromise;

  const wrapper = makeChartPanelWrapper({
    makeModel,
    metadata: { settings: { isLinked: true } },
    source: null,
    sourcePanel: null,
  });

  await expect(modelPromise).resolves.toBe(model);

  wrapper.update();

  const source = makeTable();
  wrapper.setProps({ source });

  wrapper.update();

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
