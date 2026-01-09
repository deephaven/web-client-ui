import React, { ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import dh from '@deephaven/jsapi-shim';
import { DateUtils, Settings } from '@deephaven/jsapi-utils';
import { assertNotNull, TestUtils } from '@deephaven/utils';
import { TypeValue } from '@deephaven/filters';
import {
  type ExpandableColumnGridModel,
  isExpandableColumnGridModel,
} from '@deephaven/grid';
import IrisGrid from './IrisGrid';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridProxyModel from './IrisGridProxyModel';
import IrisGridMetricCalculator from './IrisGridMetricCalculator';

class MockPath2D {
  // eslint-disable-next-line class-methods-use-this
  addPath = jest.fn();
}

window.Path2D = MockPath2D as unknown as new () => Path2D;

jest.mock('@deephaven/grid', () => ({
  ...jest.requireActual('@deephaven/grid'),
  isExpandableColumnGridModel: jest.fn(),
}));

const { asMock } = TestUtils;

const VIEW_SIZE = 5000;

const DEFAULT_SETTINGS: Settings = {
  timeZone: 'America/New_York',
  defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
  showTimeZone: false,
  showTSeparator: true,
  formatter: [],
  truncateNumbersWithPound: false,
};

const irisGridTestUtils = new IrisGridTestUtils(dh);

function makeMockCanvas() {
  return {
    clientWidth: VIEW_SIZE,
    clientHeight: VIEW_SIZE,
    getBoundingClientRect: () => ({ top: 0, left: 0 }),
    offsetLeft: 0,
    offsetTop: 0,
    getContext: TestUtils.makeMockContext,
    parentElement: {
      getBoundingClientRect: () => ({
        width: VIEW_SIZE,
        height: VIEW_SIZE,
      }),
    },
    style: {},
    focus: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
}

function makeMockWrapper() {
  return {
    getBoundingClientRect: () => ({ width: VIEW_SIZE, height: VIEW_SIZE }),
  };
}

function createNodeMock(element: ReactElement) {
  if (element.type === 'canvas') {
    return makeMockCanvas();
  }
  if (element?.props?.className?.includes('grid-wrapper') === true) {
    return makeMockWrapper();
  }
  return element;
}

function makeComponent(
  model = irisGridTestUtils.makeModel(),
  settings = DEFAULT_SETTINGS,
  props = {}
) {
  const testRenderer = TestRenderer.create(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <IrisGrid model={model} settings={settings} {...props} />,
    {
      createNodeMock,
    }
  );
  return testRenderer.getInstance() as TestRenderer.ReactTestInstance &
    IrisGrid;
}

function keyDown(key, component, extraArgs?) {
  const args = { key, ...extraArgs };
  component.grid.notifyKeyboardHandlers(
    'onDown',
    new KeyboardEvent('keydown', args)
  );
}

it('renders without crashing', () => {
  makeComponent();
});

it('handles ctrl+shift+e to clear filters', () => {
  const component = makeComponent();

  component.clearAllFilters = jest.fn();

  keyDown('e', component);
  keyDown('e', component, { ctrlKey: true });
  keyDown('e', component, { shiftKey: true });

  expect(component.clearAllFilters).not.toHaveBeenCalled();

  keyDown('e', component, { ctrlKey: true, shiftKey: true });

  expect(component.clearAllFilters).toHaveBeenCalled();
});

it('handles reverse key shortcut', () => {
  const component = makeComponent();

  component.reverse = jest.fn();

  keyDown('i', component);

  expect(component.reverse).not.toHaveBeenCalled();

  keyDown('i', component, { ctrlKey: true });

  expect(component.reverse).toHaveBeenCalled();
});

it('handles copy key handler', () => {
  const component = makeComponent();

  component.copyRanges = jest.fn();

  keyDown('c', component);

  expect(component.copyRanges).not.toHaveBeenCalled();

  keyDown('c', component, { ctrlKey: true });

  expect(component.copyRanges).toHaveBeenCalled();
});

it('handles value: undefined in setFilterMap, clears column filter', () => {
  const component = makeComponent();
  component.setQuickFilter = jest.fn();
  component.removeQuickFilter = jest.fn();
  component.setFilterMap(
    new Map([
      [
        '2',
        {
          columnType: IrisGridTestUtils.DEFAULT_TYPE,
          filterList: [
            {
              operator: 'eq',
              text: 'any',
              value: undefined,
              startColumnIndex: 0,
            },
          ],
        },
      ],
    ])
  );
  expect(component.setQuickFilter).not.toHaveBeenCalled();
  expect(component.removeQuickFilter).toHaveBeenCalledWith(2);
});

it('handles value: null in setFilterMap', () => {
  const component = makeComponent();
  component.setQuickFilter = jest.fn();
  component.setFilterMap(
    new Map([
      [
        '2',
        {
          columnType: IrisGridTestUtils.DEFAULT_TYPE,
          filterList: [
            { operator: 'eq', text: 'null', value: null, startColumnIndex: 0 },
          ],
        },
      ],
    ])
  );
  expect(component.setQuickFilter).toHaveBeenCalledWith(
    2,
    expect.anything(),
    '=null'
  );
});

it('handles undefined operator, should default to eq', () => {
  const component = makeComponent();
  component.setQuickFilter = jest.fn();
  component.setFilterMap(
    new Map([
      [
        '2',
        {
          columnType: IrisGridTestUtils.DEFAULT_TYPE,
          filterList: [
            {
              operator: undefined as unknown as TypeValue,
              text: 'any',
              value: 'any',
              startColumnIndex: 0,
            },
          ],
        },
      ],
    ])
  );
  expect(component.setQuickFilter).toHaveBeenCalledWith(
    2,
    expect.anything(),
    'any'
  );
});

it('should set gotoValueSelectedColumnName to empty string if no columns are given', () => {
  const component = makeComponent(
    irisGridTestUtils.makeModel(
      irisGridTestUtils.makeTable({
        columns: [],
      })
    )
  );

  expect(component.state.gotoValueSelectedColumnName).toEqual('');
});

describe('rebuildFilters', () => {
  it('updates state if filters not empty', () => {
    const component = makeComponent(undefined, undefined, {
      quickFilters: [
        [
          '2',
          {
            columnType: IrisGridTestUtils.DEFAULT_TYPE,
            filterList: [
              {
                operator: 'eq',
                text: 'null',
                value: null,
                startColumnIndex: 0,
              },
            ],
          },
        ],
      ],
    });
    jest.spyOn(component, 'setState');
    expect(component.setState).not.toBeCalled();
    component.rebuildFilters();
    expect(component.setState).toBeCalled();
  });

  it('does not update state for empty filters', () => {
    const component = makeComponent();
    jest.spyOn(component, 'setState');
    component.rebuildFilters();
    expect(component.setState).not.toBeCalled();
  });
});

describe('column expand/collapse', () => {
  let model: IrisGridProxyModel & ExpandableColumnGridModel;
  let component: IrisGrid;

  beforeEach(() => {
    model = irisGridTestUtils.makeModel() as IrisGridProxyModel &
      ExpandableColumnGridModel;
    component = makeComponent(model);
    model.setColumnExpanded = jest.fn();
    model.isColumnExpanded = jest.fn(() => false);
    model.expandAllColumns = jest.fn();
    model.collapseAllColumns = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls setColumnExpanded if model supports expandable columns', () => {
    asMock(isExpandableColumnGridModel).mockReturnValue(true);
    model.hasExpandableColumns = true;
    component.toggleExpandColumn(0);
    expect(model.setColumnExpanded).toHaveBeenCalled();
  });

  it('ignores setColumnExpanded and expand/collapse all if model does not support expandable columns', () => {
    asMock(isExpandableColumnGridModel).mockReturnValue(false);
    component.toggleExpandColumn(0);
    expect(model.setColumnExpanded).not.toHaveBeenCalled();

    component.expandAllColumns();
    expect(model.expandAllColumns).not.toHaveBeenCalled();

    component.collapseAllColumns();
    expect(model.collapseAllColumns).not.toHaveBeenCalled();
  });

  it('calls expandAllColumns if model supports expandable columns and expand all', () => {
    asMock(isExpandableColumnGridModel).mockReturnValue(true);
    model.isExpandAllColumnsAvailable = true;
    component.expandAllColumns();
    expect(model.expandAllColumns).toHaveBeenCalled();

    component.collapseAllColumns();
    expect(model.collapseAllColumns).toHaveBeenCalled();
  });

  it('ignores expandAllColumns if model does not support expand all', () => {
    asMock(isExpandableColumnGridModel).mockReturnValue(true);
    model.isExpandAllColumnsAvailable = false;

    component.expandAllColumns();
    expect(model.expandAllColumns).not.toHaveBeenCalled();

    component.collapseAllColumns();
    expect(model.collapseAllColumns).not.toHaveBeenCalled();
  });
});

describe('rebuildFilters', () => {
  it('updates state if filters not empty', () => {
    const testComponent = makeComponent(undefined, undefined, {
      quickFilters: [
        [
          '2',
          {
            columnType: IrisGridTestUtils.DEFAULT_TYPE,
            filterList: [
              {
                operator: 'eq',
                text: 'null',
                value: null,
                startColumnIndex: 0,
              },
            ],
          },
        ],
      ],
    });
    jest.spyOn(testComponent, 'setState');
    expect(testComponent.setState).not.toBeCalled();
    act(() => {
      testComponent.rebuildFilters();
    });
    expect(testComponent.setState).toBeCalled();
  });

  it('does not update state for empty filters', () => {
    const testComponent = makeComponent();
    jest.spyOn(testComponent, 'setState');
    testComponent.rebuildFilters();
    expect(testComponent.setState).not.toBeCalled();
  });
});

describe('Advanced Filter', () => {
  it.each([
    { columnIndex: -1, expectedVisibility: false },
    { columnIndex: 0, expectedVisibility: true },
    { columnIndex: 1, expectedVisibility: true },
  ])(
    'advanced filter button for column index $columnIndex should be rendered: $expectedVisibility',
    ({ columnIndex, expectedVisibility }) => {
      const metricCalculator = new IrisGridMetricCalculator();
      const testModel = irisGridTestUtils.makeModel();
      const testRenderer = TestRenderer.create(
        <IrisGrid model={testModel} settings={DEFAULT_SETTINGS} />,
        {
          createNodeMock,
        }
      );
      const testComponent =
        testRenderer.getInstance() as TestRenderer.ReactTestInstance & IrisGrid;
      assertNotNull(testComponent.grid);
      testComponent.grid.metricCalculator = metricCalculator;
      testComponent.setState({
        isFilterBarShown: true,
        hoverAdvancedFilter: columnIndex,
      });
      const advancedFilterButtons = testRenderer.root.findAll(
        el => el.props?.className?.includes('advanced-filter-button') === true
      );

      expect(advancedFilterButtons.length > 0).toBe(expectedVisibility);
    }
  );
});
