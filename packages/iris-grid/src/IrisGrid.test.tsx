import React, { useRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { DateUtils, type Settings } from '@deephaven/jsapi-utils';
import { type TypeValue } from '@deephaven/filters';
import IrisGrid from './IrisGrid';
import IrisGridTestUtils from './IrisGridTestUtils';

const VIEW_SIZE = 500;

const DEFAULT_SETTINGS: Settings = {
  timeZone: 'America/New_York',
  defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
  showTimeZone: false,
  showTSeparator: true,
  formatter: [],
  truncateNumbersWithPound: false,
};

const irisGridTestUtils = new IrisGridTestUtils(dh);

jest
  .spyOn(Element.prototype, 'getBoundingClientRect')
  .mockReturnValue(new DOMRect(0, 0, VIEW_SIZE, VIEW_SIZE));

jest.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(VIEW_SIZE);

jest.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(VIEW_SIZE);

function makeComponent(
  model = irisGridTestUtils.makeModel(),
  settings = DEFAULT_SETTINGS
) {
  let ref: React.RefObject<IrisGrid>;
  function IrisGridWithRef() {
    ref = useRef<IrisGrid>(null);
    return <IrisGrid model={model} settings={settings} ref={ref} />;
  }
  render(<IrisGridWithRef />);
  return ref!.current as IrisGrid;
}

function keyDown(
  key: string,
  component: IrisGrid,
  extraArgs?: Partial<KeyboardEventInit>
) {
  const args = { key, ...extraArgs };
  fireEvent.keyDown(component.grid!.canvas!, args);
  // component.grid.notifyKeyboardHandlers(
  //   'onDown',
  //   new KeyboardEvent('keydown', args)
  // );
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

describe('handleResizeColumn', () => {
  let irisGrid;
  let metricCalculator;

  beforeAll(() => {
    irisGrid = makeComponent(
      irisGridTestUtils.makeModel(
        irisGridTestUtils.makeTable({
          columns: irisGridTestUtils.makeColumns(1),
        })
      )
    );
    metricCalculator = irisGrid.state.metricCalculator;
  });

  it('should set column width to content width if undefined user width', async () => {
    const modelIndex = 0;
    const mockMetricCalculator = {
      ...metricCalculator,
      userColumnWidths: new Map(),
      setColumnWidth: jest.fn((column, size) => {
        mockMetricCalculator.userColumnWidths.set(column, size);
      }),
    };
    Object.assign(irisGrid.state.metricCalculator, mockMetricCalculator);
    const contentWidth =
      irisGrid.state.metrics.contentColumnWidths.get(modelIndex);
    expect(contentWidth).toBeDefined();

    irisGrid.handleResizeColumn(modelIndex);

    expect(mockMetricCalculator.userColumnWidths.get(modelIndex)).toEqual(
      contentWidth
    );
  });

  it('should reset user width & set calculated width to content width if column has defined user width', () => {
    const modelIndex = 0;
    const mockMetricCalculator = {
      ...metricCalculator,
      userColumnWidths: new Map([[modelIndex, 100]]),
      setCalculatedColumnWidth: jest.fn((column, size) => {
        mockMetricCalculator.calculatedColumnWidths.set(column, size);
      }),
      resetColumnWidth: jest.fn(() => {
        mockMetricCalculator.userColumnWidths.delete(modelIndex);
      }),
    };
    Object.assign(irisGrid.state.metricCalculator, mockMetricCalculator);
    const contentWidth =
      irisGrid.state.metrics.contentColumnWidths.get(modelIndex);
    expect(contentWidth).toBeDefined();

    irisGrid.handleResizeColumn(modelIndex);

    expect(
      mockMetricCalculator.userColumnWidths.get(modelIndex)
    ).toBeUndefined();
    expect(mockMetricCalculator.calculatedColumnWidths.get(modelIndex)).toEqual(
      contentWidth
    );
  });
});

// auto resize -> reset user width and set calculated width to content width
// manual resize -> set user width to content width
describe('handleResizeAllColumns', () => {
  let irisGrid;
  let metricCalculator;

  beforeAll(() => {
    irisGrid = makeComponent(
      irisGridTestUtils.makeModel(
        irisGridTestUtils.makeTable({
          columns: irisGridTestUtils.makeColumns(3),
        })
      )
    );
    metricCalculator = irisGrid.state.metricCalculator;
  });

  it('should auto resize all columns if all were manually sized', () => {
    const mockMetricCalculator = {
      ...metricCalculator,
      userColumnWidths: new Map([
        [0, 100],
        [1, 100],
        [2, 100],
      ]),
      setCalculatedColumnWidth: jest.fn((column, size) => {
        mockMetricCalculator.calculatedColumnWidths.set(column, size);
      }),
      resetColumnWidth: jest.fn(column => {
        mockMetricCalculator.userColumnWidths.delete(column);
      }),
    };
    Object.assign(irisGrid.state.metricCalculator, mockMetricCalculator);
    const contentWidths = irisGrid.state.metrics.contentColumnWidths;

    irisGrid.handleResizeAllColumns();

    expect(mockMetricCalculator.userColumnWidths.size).toEqual(0);

    contentWidths.forEach((contentWidth, modelIndex) => {
      expect(
        mockMetricCalculator.calculatedColumnWidths.get(modelIndex)
      ).toEqual(contentWidth);
    });
  });

  it('should manual resize all columns if not all were manually sized', () => {
    const mockMetricCalculator = {
      ...metricCalculator,
      userColumnWidths: new Map([
        [0, 100],
        [1, 100],
      ]),
      setColumnWidth: jest.fn((column, size) => {
        mockMetricCalculator.userColumnWidths.set(column, size);
      }),
      resetColumnWidth: jest.fn(column => {
        mockMetricCalculator.userColumnWidths.delete(column);
      }),
    };
    Object.assign(irisGrid.state.metricCalculator, mockMetricCalculator);
    const contentWidths = irisGrid.state.metrics.contentColumnWidths;

    irisGrid.handleResizeAllColumns();

    contentWidths.forEach((contentWidth, modelIndex) => {
      expect(mockMetricCalculator.userColumnWidths.get(modelIndex)).toEqual(
        contentWidth
      );
    });
  });
});
