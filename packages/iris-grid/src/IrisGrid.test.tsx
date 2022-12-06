import React from 'react';
import TestRenderer from 'react-test-renderer';
import { DateUtils } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import { IrisGrid, Settings } from './IrisGrid';
import IrisGridTestUtils from './IrisGridTestUtils';

class MockPath2D {
  // eslint-disable-next-line class-methods-use-this
  addPath = jest.fn();
}

window.Path2D = MockPath2D;

const VIEW_SIZE = 5000;

const DEFAULT_SETTINGS: Settings = {
  timeZone: 'America/New_York',
  defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
  showTimeZone: false,
  showTSeparator: true,
  formatter: [],
  truncateNumbersWithPound: false,
};

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

function createNodeMock(element) {
  if (element.type === 'canvas') {
    return makeMockCanvas();
  }
  return element;
}

function makeComponent(
  model = IrisGridTestUtils.makeModel(),
  settings = DEFAULT_SETTINGS
) {
  const testRenderer = TestRenderer.create(
    <IrisGrid model={model} settings={settings} />,
    {
      createNodeMock,
    }
  );
  return testRenderer.getInstance();
}

function keyDown(key, component, extraArgs?) {
  const args = { key, ...extraArgs };
  component.grid.handleKeyDown(new KeyboardEvent('keydown', args));
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
  expect(component.setQuickFilter).toHaveBeenCalledWith(
    2,
    expect.anything(),
    ''
  );
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
              operator: undefined,
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
