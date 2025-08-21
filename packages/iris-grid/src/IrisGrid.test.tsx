import React, { ReactElement } from 'react';
import TestRenderer from 'react-test-renderer';
import dh from '@deephaven/jsapi-shim';
import { DateUtils, Settings } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import { TypeValue } from '@deephaven/filters';
import {
  ExpandableColumnGridModel,
  isExpandableColumnGridModel,
} from '@deephaven/grid';
import IrisGrid from './IrisGrid';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridProxyModel from './IrisGridProxyModel';

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
  settings = DEFAULT_SETTINGS
) {
  const testRenderer = TestRenderer.create(
    <IrisGrid model={model} settings={settings} />,
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

describe('column expand/collapse', () => {
  function testColumnExpandCollapse({
    isExpandable,
    isExpandAllAvailable,
    expectToggleToWork,
    expectExpandAllToWork,
  }: {
    isExpandable: boolean;
    isExpandAllAvailable: boolean;
    expectToggleToWork: boolean;
    expectExpandAllToWork: boolean;
  }) {
    const model = irisGridTestUtils.makeModel() as IrisGridProxyModel &
      ExpandableColumnGridModel;
    const component = makeComponent(model);

    model.setColumnExpanded = jest.fn();
    model.isColumnExpanded = jest.fn(() => false);
    model.expandAllColumns = jest.fn();
    model.collapseAllColumns = jest.fn();
    model.isExpandAllColumnsAvailable = isExpandAllAvailable;

    asMock(isExpandableColumnGridModel).mockReturnValue(isExpandable);

    component.toggleExpandColumn(0);
    if (expectToggleToWork) {
      expect(model.setColumnExpanded).toHaveBeenCalled();
    } else {
      expect(model.setColumnExpanded).not.toHaveBeenCalled();
    }

    component.expandAllColumns();
    if (expectExpandAllToWork) {
      expect(model.expandAllColumns).toHaveBeenCalled();
    } else {
      expect(model.expandAllColumns).not.toHaveBeenCalled();
    }

    component.collapseAllColumns();
    if (expectExpandAllToWork) {
      expect(model.collapseAllColumns).toHaveBeenCalled();
    } else {
      expect(model.collapseAllColumns).not.toHaveBeenCalled();
    }
  }

  it.each([
    {
      description: 'model does not support expandable columns',
      isExpandable: false,
      isExpandAllAvailable: false,
      expectToggleToWork: false,
      expectExpandAllToWork: false,
    },
    {
      description: 'model supports expandable columns but not expand all',
      isExpandable: true,
      isExpandAllAvailable: false,
      expectToggleToWork: true,
      expectExpandAllToWork: false,
    },
    {
      description: 'model supports both expandable columns and expand all',
      isExpandable: true,
      isExpandAllAvailable: true,
      expectToggleToWork: true,
      expectExpandAllToWork: true,
    },
  ])(
    'should handle column expand/collapse when $description',
    ({
      isExpandable,
      isExpandAllAvailable,
      expectToggleToWork,
      expectExpandAllToWork,
    }) => {
      testColumnExpandCollapse({
        isExpandable,
        isExpandAllAvailable,
        expectToggleToWork,
        expectExpandAllToWork,
      });
    }
  );
});
