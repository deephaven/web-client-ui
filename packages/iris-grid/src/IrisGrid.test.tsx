import React, { useRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { DateUtils, type Settings } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/test-utils';
import { type TypeValue } from '@deephaven/filters';
import {
  type ExpandableColumnGridModel,
  isExpandableColumnGridModel,
} from '@deephaven/grid';
import IrisGrid from './IrisGrid';
import IrisGridTestUtils from './IrisGridTestUtils';
import type IrisGridProxyModel from './IrisGridProxyModel';

jest.mock('@deephaven/grid', () => ({
  ...jest.requireActual('@deephaven/grid'),
  isExpandableColumnGridModel: jest.fn(),
}));

const { asMock } = TestUtils;

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
  settings = DEFAULT_SETTINGS,
  props = {}
) {
  let ref: React.RefObject<IrisGrid>;
  function IrisGridWithRef() {
    ref = useRef<IrisGrid>(null);
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <IrisGrid model={model} settings={settings} ref={ref} {...props} />;
  }
  render(<IrisGridWithRef />);
  return ref!.current!;
}

function keyDown(
  key: string,
  component: IrisGrid,
  extraArgs?: Partial<KeyboardEventInit>
) {
  const args = { key, ...extraArgs };
  fireEvent.keyDown(component.grid!.canvas!, args);
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

    act(() => irisGrid.handleResizeColumn(modelIndex));

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

    act(() => irisGrid.handleResizeColumn(modelIndex));

    expect(
      mockMetricCalculator.userColumnWidths.get(modelIndex)
    ).toBeUndefined();
    expect(mockMetricCalculator.calculatedColumnWidths.get(modelIndex)).toEqual(
      contentWidth
    );
  });
});

describe('handleRollupChange', () => {
  it('seeds metric calculator from userColumnWidthsByName prop and preserves widths for columns absent from the current model', () => {
    // Current (rolled-up) model only contains the group-by column.
    const fullColumns = irisGridTestUtils.makeColumns(3);
    const currentColumns = [fullColumns[0]];
    const currentModel = irisGridTestUtils.makeModel(
      irisGridTestUtils.makeTable({ columns: currentColumns })
    );

    // Persisted state includes a hidden width for a column not in the
    // currently displayed (rolled-up) model.
    const hiddenName = fullColumns[2].name;
    const irisGrid = makeComponent(currentModel, DEFAULT_SETTINGS, {
      userColumnWidthsByName: new Map([[hiddenName, 0]]),
    });

    const { metricCalculator } = irisGrid.state;
    // The by-name map carries the entry even though it isn't in the model.
    expect(metricCalculator.getUserColumnWidthsByName().get(hiddenName)).toBe(
      0
    );
    // The by-index map should not include it (no model index).
    expect([...metricCalculator.getUserColumnWidths().entries()]).toEqual([]);
  });

  it('un-hides a group-by column that is absent from the current (already rolled-up) model', () => {
    // Simulates editing an existing rollup where a newly-added group-by
    // column is not present in the current model (e.g. non-aggregated columns
    // are hidden), so a model-index lookup against this.props.model would
    // miss it. Resetting by name must still clear its hidden width.
    const columns = irisGridTestUtils.makeColumns(3);
    const model = irisGridTestUtils.makeModel(
      irisGridTestUtils.makeTable({ columns })
    );
    const irisGrid = makeComponent(model);
    const { metricCalculator } = irisGrid.state;

    // Simulate the column having been hidden previously (width 0 stored by name).
    const newGroupByName = 'NotInCurrentModel';
    metricCalculator.userColumnWidthsByName.set(newGroupByName, 0);

    // Spy AFTER seeding so the spy still calls through.
    jest.spyOn(model, 'getColumnIndexByName').mockReturnValue(undefined);

    act(() => {
      irisGrid.handleRollupChange({
        columns: [newGroupByName],
        showConstituents: false,
        showNonAggregatedColumns: false,
      });
    });

    expect(metricCalculator.userColumnWidthsByName.has(newGroupByName)).toBe(
      false
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

    act(() => irisGrid.handleResizeAllColumns());

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

    act(() => irisGrid.handleResizeAllColumns());

    contentWidths.forEach((contentWidth, modelIndex) => {
      expect(mockMetricCalculator.userColumnWidths.get(modelIndex)).toEqual(
        contentWidth
      );
    });
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
      act(() => {
        component.rebuildFilters();
      });
      expect(component.setState).toBeCalled();
    });

    it('does not update state for empty filters', () => {
      const component = makeComponent();
      jest.spyOn(component, 'setState');
      act(() => {
        component.rebuildFilters();
      });
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
});

describe('Advanced Filter', () => {
  it.each([
    { columnIndex: -1, expectedVisibility: false },
    { columnIndex: 0, expectedVisibility: true },
    { columnIndex: 1, expectedVisibility: true },
  ])(
    'advanced filter button visibility is $expectedVisibility for column index $columnIndex',
    ({ columnIndex, expectedVisibility }) => {
      const model = irisGridTestUtils.makeModel();
      const ref = React.createRef<IrisGrid>();
      const { container } = render(
        <IrisGrid ref={ref} model={model} settings={DEFAULT_SETTINGS} />
      );

      act(() => {
        ref.current?.setState({
          focusedFilterBarColumn: columnIndex,
          isFilterBarShown: true,
        });
      });

      const advancedFilterButtons = container.querySelectorAll(
        '.advanced-filter-button'
      );

      expect(advancedFilterButtons.length > 0).toBe(expectedVisibility);
    }
  );
});
