import React from 'react';
import TestRenderer from 'react-test-renderer';
import { TestUtils } from '@deephaven/utils';
import { IrisGrid } from './IrisGrid';
import IrisGridTestUtils from './IrisGridTestUtils';
import DateUtils from './DateUtils';

class MockPath2D {
  // eslint-disable-next-line class-methods-use-this
  addPath() {}
}

window.Path2D = MockPath2D;

const VIEW_SIZE = 5000;

const DEFAULT_SETTINGS = {
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

function keyDown(key, component, extraArgs) {
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
