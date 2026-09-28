import type Grid from '../Grid';
import type GridMetricCalculator from '../GridMetricCalculator';
import type GridMetrics from '../GridMetrics';
import type { GridPoint } from '../GridUtils';
import GridTheme from '../GridTheme';
import MockGridModel from '../MockGridModel';
import GridColumnSeparatorMouseHandler from './GridColumnSeparatorMouseHandler';

const COLUMN_WIDTH = 100;

/**
 * Metrics for a 3 column grid where columns 1 and 2 are hidden under the
 * separator at the right edge of column 0.
 */
function makeMetrics(visibleColumns: number[]): GridMetrics {
  const allColumnWidths = new Map(
    visibleColumns.map(column => [column, column === 0 ? COLUMN_WIDTH : 0])
  );
  const allColumnXs = new Map(
    visibleColumns.map(column => [column, column === 0 ? 0 : COLUMN_WIDTH])
  );

  return {
    rowHeaderWidth: 0,
    columnHeaderHeight: 20,
    columnHeaderMaxDepth: 1,
    gridY: 20,
    visibleRows: [],
    allRowYs: new Map(),
    allRowHeights: new Map(),
    columnCount: 3,
    firstColumn: 0,
    treePaddingX: 0,
    movedColumns: [],
    floatingColumns: [],
    floatingLeftWidth: 0,
    visibleColumns,
    allColumnWidths,
    allColumnXs,
    visibleColumnWidths: allColumnWidths,
    visibleColumnXs: allColumnXs,
    modelColumns: new Map(visibleColumns.map(column => [column, column])),
    userColumnWidths: new Map(),
    calculatedColumnWidths: new Map([
      [0, COLUMN_WIDTH],
      [1, COLUMN_WIDTH],
      [2, COLUMN_WIDTH],
    ]),
  } as unknown as GridMetrics;
}

function makeGrid(metrics: GridMetrics): Grid {
  return {
    metrics,
    metricCalculator: {
      initialColumnWidths: new Map(),
      setColumnWidth: jest.fn(),
      resetColumnWidth: jest.fn(),
    } as unknown as GridMetricCalculator,
    props: { model: new MockGridModel() },
    getTheme: () => GridTheme,
    setState: jest.fn(),
  } as unknown as Grid;
}

function makeGridPoint(x: number): GridPoint {
  return { x, y: 10, columnHeaderDepth: 0 } as GridPoint;
}

it('does not throw when a resized column is pushed out of the viewport', () => {
  const handler = new GridColumnSeparatorMouseHandler(200);
  const grid = makeGrid(makeMetrics([0, 1, 2]));

  expect(handler.onDown(makeGridPoint(COLUMN_WIDTH), grid)).toBe(true);
  expect(handler.onDrag(makeGridPoint(COLUMN_WIDTH * 4), grid)).toBe(true);

  // Expanding the hidden columns pushes column 2 past the right edge of the grid
  const scrolledGrid = makeGrid(makeMetrics([0, 1]));

  expect(() =>
    handler.onDrag(makeGridPoint(COLUMN_WIDTH * 6), scrolledGrid)
  ).not.toThrow();
});
