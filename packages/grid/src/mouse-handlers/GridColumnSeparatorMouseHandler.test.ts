import type Grid from '../Grid';
import type GridMetricCalculator from '../GridMetricCalculator';
import type GridMetrics from '../GridMetrics';
import type { GridPoint } from '../GridUtils';
import GridTheme from '../GridTheme';
import MockGridModel from '../MockGridModel';
import GridColumnSeparatorMouseHandler from './GridColumnSeparatorMouseHandler';

const COLUMN_WIDTH = 100;

/**
 * Metrics for a 3 column grid. By default columns 1 and 2 are hidden under the
 * separator at the right edge of column 0.
 */
function makeMetrics(
  visibleColumns: number[],
  hiddenColumns: number[] = [1, 2]
): GridMetrics {
  const widthOf = (column: number) =>
    hiddenColumns.includes(column) ? 0 : COLUMN_WIDTH;

  const allColumnWidths = new Map(
    visibleColumns.map(column => [column, widthOf(column)])
  );

  let nextX = 0;
  const allColumnXs = new Map(
    visibleColumns.map(column => {
      const columnX = nextX;
      nextX += widthOf(column);
      return [column, columnX];
    })
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
    forceUpdate: jest.fn(),
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

it('does not throw when dragging back over a column that left the viewport', () => {
  const handler = new GridColumnSeparatorMouseHandler(200);
  const grid = makeGrid(makeMetrics([0, 1, 2]));

  expect(handler.onDown(makeGridPoint(COLUMN_WIDTH), grid)).toBe(true);
  expect(handler.onDrag(makeGridPoint(COLUMN_WIDTH * 4), grid)).toBe(true);

  const scrolledGrid = makeGrid(makeMetrics([0, 1]));
  expect(handler.onDrag(makeGridPoint(COLUMN_WIDTH * 6), scrolledGrid)).toBe(
    true
  );

  // Dragging back left collapses column 1, so the handler resumes resizing
  // column 2 while it is still outside the viewport
  expect(() =>
    handler.onDrag(makeGridPoint(COLUMN_WIDTH * 1.5), scrolledGrid)
  ).not.toThrow();

  expect(scrolledGrid.metricCalculator.setColumnWidth).toHaveBeenLastCalledWith(
    1,
    0
  );

  // Collapsing column 1 brings column 2 back into the viewport. Its target size
  // must have been removed from the drag offset, otherwise it resizes relative
  // to the wrong pointer position.
  const restoredGrid = makeGrid(makeMetrics([0, 1, 2]));
  expect(handler.onDrag(makeGridPoint(COLUMN_WIDTH * 2.5), restoredGrid)).toBe(
    true
  );

  expect(restoredGrid.metricCalculator.resetColumnWidth).toHaveBeenCalledWith(
    2
  );
  expect(restoredGrid.metricCalculator.setColumnWidth).toHaveBeenCalledWith(
    1,
    50
  );
});

it('only sets the resize cursor while over a separator', () => {
  const handler = new GridColumnSeparatorMouseHandler(200);
  const grid = makeGrid(makeMetrics([0, 1, 2], []));

  expect(handler.onMove(makeGridPoint(COLUMN_WIDTH), grid)).toBe(true);
  expect(handler.cursor).toBe('col-resize');

  expect(handler.onMove(makeGridPoint(COLUMN_WIDTH * 1.5), grid)).toBe(false);
});

it('resets the column width on double click of a separator', () => {
  const handler = new GridColumnSeparatorMouseHandler(200);
  const grid = makeGrid(makeMetrics([0, 1, 2], []));

  expect(handler.onDoubleClick(makeGridPoint(COLUMN_WIDTH * 1.5), grid)).toBe(
    false
  );
  expect(grid.metricCalculator.resetColumnWidth).not.toHaveBeenCalled();

  expect(handler.onDoubleClick(makeGridPoint(COLUMN_WIDTH), grid)).toBe(true);
  expect(grid.metricCalculator.resetColumnWidth).toHaveBeenCalledWith(0);
});

it('clears the separator state on mouse up', () => {
  const handler = new GridColumnSeparatorMouseHandler(200);
  const grid = makeGrid(makeMetrics([0, 1, 2], []));

  // Not dragging, so nothing to clean up
  expect(handler.onDrag(makeGridPoint(COLUMN_WIDTH), grid)).toBe(false);
  expect(handler.onUp(makeGridPoint(COLUMN_WIDTH), grid)).toBe(false);
  expect(grid.setState).not.toHaveBeenCalled();

  expect(handler.onDown(makeGridPoint(COLUMN_WIDTH), grid)).toBe(true);
  expect(handler.onUp(makeGridPoint(COLUMN_WIDTH), grid)).toBe(false);
  expect(grid.setState).toHaveBeenLastCalledWith({
    draggingColumnSeparator: null,
    isDragging: false,
  });
});
