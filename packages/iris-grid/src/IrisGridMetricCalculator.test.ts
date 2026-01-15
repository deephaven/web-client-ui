import { GridMetricCalculator, type GridMetrics } from '@deephaven/grid';
import { type dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import {
  IrisGridMetricCalculator,
  type IrisGridMetricState,
} from './IrisGridMetricCalculator';
import type IrisGridModel from './IrisGridModel';
import { type IrisGridThemeType } from './IrisGridTheme';

const { createMockProxy } = TestUtils;

function makeColumns(count = 5): dh.Column[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProxy<dh.Column>({
      name: `Column${i + 1}`,
      type: 'java.lang.String',
    })
  );
}

function makeGridMetricState(model: IrisGridModel): IrisGridMetricState {
  return createMockProxy<IrisGridMetricState>({
    model,
    draggingColumn: undefined,
  });
}

// Spy on GridMetricCalculator.getMetrics
jest.spyOn(GridMetricCalculator.prototype, 'getMetrics');

// Spy on GridMetricCalculator.setColumnWidth
jest.spyOn(GridMetricCalculator.prototype, 'setColumnWidth');

describe('IrisGridMetricCalculator', () => {
  let calculator: IrisGridMetricCalculator;
  let model;
  let state: IrisGridMetricState;
  let columns: dh.Column[];

  beforeEach(() => {
    columns = makeColumns();
    model = createMockProxy<IrisGridModel>({
      get columns() {
        return columns;
      },
      getColumnIndexByName: name => {
        const index = columns.findIndex(col => col.name === name);
        return index !== -1 ? index : undefined;
      },
      get columnHeaderGroups() {
        return [];
      },
    });
    calculator = new IrisGridMetricCalculator();
    state = makeGridMetricState(model);
  });

  it('preserves column width based on column name instead of index', () => {
    expect(calculator.getUserColumnWidths().size).toBe(0);

    expect(model.getColumnIndexByName('Column1')).toBe(0);

    // setColumnWidth requires getMetrics call
    calculator.getMetrics(state);
    calculator.setColumnWidth(model.getColumnIndexByName('Column1'), 100);
    calculator.setColumnWidth(model.getColumnIndexByName('Column2'), 200);
    calculator.setColumnWidth(model.getColumnIndexByName('Column3'), 300);

    // Calling getMetrics to update user column widths
    calculator.getMetrics(state);
    expect(calculator.getUserColumnWidths().size).toBe(3);

    // Delete Column2
    columns = columns.filter(col => col.name !== 'Column2');

    expect(state.model.columns[1].name).toBe('Column3');

    calculator.getMetrics(state);
    expect([...calculator.getUserColumnWidths().entries()]).toEqual([
      [0, 100],
      [1, 300],
    ]);

    // Restore Column2
    columns = [
      columns[0],
      createMockProxy<dh.Column>({
        name: 'Column2',
        type: 'java.lang.String',
      }),
      ...columns.slice(1),
    ];

    calculator.getMetrics(state);
    expect([...calculator.getUserColumnWidths().entries()]).toEqual([
      [0, 100],
      [1, 200],
      [2, 300],
    ]);
  });

  it('setColumnWidth updates user column width', () => {
    calculator.getMetrics(state);
    calculator.setColumnWidth(model.getColumnIndexByName('Column1'), 100);

    expect(calculator.getUserColumnWidths().size).toBe(1);
    expect(calculator.getUserColumnWidths().get(0)).toBe(100);

    calculator.setColumnWidth(model.getColumnIndexByName('Column1'), 150);
    expect(calculator.getUserColumnWidths().get(0)).toBe(150);
  });

  describe('getFilterInputCoordinates', () => {
    it.each([
      {
        description: 'returns null for negative column index',
        index: -1,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: 30,
        expected: null,
      },
      {
        description: 'returns null when columnX is not found',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map(), // Empty map
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: 30,
        expected: null,
      },
      {
        description: 'returns null when columnWidth is not found',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map(), // Empty map
        filterBarHeight: 30,
        expected: null,
      },
      {
        description: 'returns correct coordinates for valid column',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: 30,
        expected: {
          x: 110, // gridX (10) + columnX (100)
          y: 20, // gridY (50) - filterBarHeight (30)
          width: 151, // columnWidth (150) + 1
          height: 29, // filterBarHeight (30) - 1
        },
      },
      {
        description: 'handles undefined filterBarHeight',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: undefined,
        expected: null,
      },
    ])(
      '$description',
      ({
        index,
        gridX,
        gridY,
        allColumnXs,
        allColumnWidths,
        filterBarHeight,
        expected,
      }) => {
        const metrics = createMockProxy<GridMetrics>({
          gridX,
          gridY,
          allColumnXs,
          allColumnWidths,
        });
        const stateWithTheme = createMockProxy<IrisGridMetricState>({
          ...state,
          theme: { filterBarHeight } as IrisGridThemeType,
        });

        const result = calculator.getFilterInputCoordinates(
          index,
          stateWithTheme,
          metrics
        );

        expect(result).toEqual(expected);
      }
    );

    it('works with multiple columns', () => {
      const metrics = createMockProxy<GridMetrics>({
        gridX: 20,
        gridY: 100,
        allColumnXs: new Map([
          [0, 0],
          [1, 100],
          [2, 250],
        ]),
        allColumnWidths: new Map([
          [0, 100],
          [1, 150],
          [2, 200],
        ]),
      });
      const stateWithTheme = createMockProxy<IrisGridMetricState>({
        ...state,
        theme: { filterBarHeight: 40 } as IrisGridThemeType,
      });

      const testCases = [
        {
          index: 0,
          expected: {
            x: 20, // gridX (20) + columnX (0)
            y: 60, // gridY (100) - filterBarHeight (40)
            width: 101,
            height: 39,
          },
        },
        {
          index: 1,
          expected: {
            x: 120, // gridX (20) + columnX (100)
            y: 60,
            width: 151,
            height: 39,
          },
        },
        {
          index: 2,
          expected: {
            x: 270, // gridX (20) + columnX (250)
            y: 60,
            width: 201,
            height: 39,
          },
        },
      ];

      testCases.forEach(({ index, expected }) => {
        const result = calculator.getFilterInputCoordinates(
          index,
          stateWithTheme,
          metrics
        );
        expect(result).toEqual(expected);
      });
    });
  });

  describe('getAdvancedFilterButtonCoordinates', () => {
    it.each([
      {
        description: 'returns null for negative column index',
        index: -1,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: 30,
        expected: null,
      },
      {
        description: 'returns null when columnX is not found',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map(), // Empty map
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: 30,
        expected: null,
      },
      {
        description: 'returns null when columnWidth is not found',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map(), // Empty map
        filterBarHeight: 30,
        expected: null,
      },
      {
        description: 'returns null when columnWidth is zero',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map([[0, 0]]),
        filterBarHeight: 30,
        expected: null,
      },
      {
        description: 'returns correct coordinates for valid column',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: 30,
        expected: {
          x: 236, // gridX (10) + columnX (100) + columnWidth (150) - 24
          y: 22, // gridY (50) - filterBarHeight (30) + 2
        },
      },
      {
        description: 'handles undefined filterBarHeight',
        index: 0,
        gridX: 10,
        gridY: 50,
        allColumnXs: new Map([[0, 100]]),
        allColumnWidths: new Map([[0, 150]]),
        filterBarHeight: undefined,
        expected: null,
      },
    ])(
      '$description',
      ({
        index,
        gridX,
        gridY,
        allColumnXs,
        allColumnWidths,
        filterBarHeight,
        expected,
      }) => {
        const metrics = createMockProxy<GridMetrics>({
          gridX,
          gridY,
          allColumnXs,
          allColumnWidths,
        });
        const stateWithTheme = createMockProxy<IrisGridMetricState>({
          ...state,
          theme: { filterBarHeight } as IrisGridThemeType,
        });

        const result = calculator.getAdvancedFilterButtonCoordinates(
          index,
          stateWithTheme,
          metrics
        );

        expect(result).toEqual(expected);
      }
    );

    it('works with multiple columns', () => {
      const metrics = createMockProxy<GridMetrics>({
        gridX: 20,
        gridY: 100,
        allColumnXs: new Map([
          [0, 0],
          [1, 100],
          [2, 250],
        ]),
        allColumnWidths: new Map([
          [0, 100],
          [1, 150],
          [2, 200],
        ]),
      });
      const stateWithTheme = createMockProxy<IrisGridMetricState>({
        ...state,
        theme: { filterBarHeight: 40 } as IrisGridThemeType,
      });

      const testCases = [
        {
          index: 0,
          expected: {
            x: 96, // gridX (20) + columnX (0) + columnWidth (100) - 24
            y: 62, // gridY (100) - filterBarHeight (40) + 2
          },
        },
        {
          index: 1,
          expected: {
            x: 246, // gridX (20) + columnX (100) + columnWidth (150) - 24
            y: 62,
          },
        },
        {
          index: 2,
          expected: {
            x: 446, // gridX (20) + columnX (250) + columnWidth (200) - 24
            y: 62,
          },
        },
      ];

      testCases.forEach(({ index, expected }) => {
        const result = calculator.getAdvancedFilterButtonCoordinates(
          index,
          stateWithTheme,
          metrics
        );
        expect(result).toEqual(expected);
      });
    });
  });

  describe('getScrollLeftForColumn', () => {
    it.each([
      {
        description: 'returns null for negative column index',
        column: -1,
        left: 5,
        rightVisible: 10,
        lastLeft: 50,
        expected: null,
      },
      {
        description: 'returns column when column < left',
        column: 3,
        left: 5,
        rightVisible: 10,
        lastLeft: 50,
        expected: 3,
      },
      {
        description: 'returns null when column is in visible range',
        column: 7,
        left: 5,
        rightVisible: 10,
        lastLeft: 50,
        expected: null,
      },
      {
        description: 'calculates new left when column > rightVisible',
        column: 15,
        left: 5,
        rightVisible: 10,
        lastLeft: 50,
        expected: expect.any(Number),
      },
    ])('$description', ({ column, left, rightVisible, lastLeft, expected }) => {
      const metrics = createMockProxy<GridMetrics>({
        left,
        rightVisible,
        lastLeft,
      });

      const result = calculator.getScrollLeftForColumn(column, state, metrics);
      if (expected === expect.any(Number)) {
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(lastLeft);
      } else {
        expect(result).toEqual(expected);
      }
    });

    it('returns min of calculated left and lastLeft when scrolling right', () => {
      const metrics = createMockProxy<GridMetrics>({
        left: 0,
        rightVisible: 5,
        lastLeft: 10,
      });

      const result = calculator.getScrollLeftForColumn(15, state, metrics);

      expect(result).not.toBeNull();
      expect(result).toBeLessThanOrEqual(10); // Should not exceed lastLeft
    });
  });
});
