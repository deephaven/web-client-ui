import { createGridA11ySnapshot, getGridA11ySummary } from './GridA11yUtils';
import type GridMetrics from './GridMetrics';
import GridRange from './GridRange';
import MockGridModel from './MockGridModel';

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 30;
const ROW_HEADER_WIDTH = 30;

/**
 * Make metrics for a viewport of the given size, laid out left to right and
 * top to bottom. Any column in `hiddenColumns` is collapsed to zero width.
 */
function makeMetrics({
  columns = [0, 1, 2],
  rows = [0, 1],
  hiddenColumns = [] as number[],
} = {}): GridMetrics {
  const allColumnWidths = new Map<number, number>();
  const allColumnXs = new Map<number, number>();
  const modelColumns = new Map<number, number>();
  let x = 0;
  columns.forEach(column => {
    const width = hiddenColumns.includes(column) ? 0 : COLUMN_WIDTH;
    allColumnWidths.set(column, width);
    allColumnXs.set(column, x);
    modelColumns.set(column, column);
    x += width;
  });

  const allRowHeights = new Map<number, number>();
  const allRowYs = new Map<number, number>();
  const modelRows = new Map<number, number>();
  rows.forEach((row, index) => {
    allRowHeights.set(row, ROW_HEIGHT);
    allRowYs.set(row, index * ROW_HEIGHT);
    modelRows.set(row, row);
  });

  return {
    allColumns: columns,
    allRows: rows,
    allColumnWidths,
    allColumnXs,
    allRowHeights,
    allRowYs,
    modelColumns,
    modelRows,
    gridX: ROW_HEADER_WIDTH,
    gridY: HEADER_HEIGHT,
    columnHeaderHeight: HEADER_HEIGHT,
    topVisible: rows[0],
    bottomVisible: rows[rows.length - 1],
  } as unknown as GridMetrics;
}

describe('getGridA11ySummary', () => {
  it('describes the size of the grid', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(getGridA11ySummary(model)).toBe('Grid with 100 rows and 3 columns.');
  });

  it('describes the number of selected cells', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(getGridA11ySummary(model, [new GridRange(0, 0, 0, 0)])).toBe(
      'Grid with 100 rows and 3 columns. 1 cell selected.'
    );
    expect(getGridA11ySummary(model, [new GridRange(0, 0, 1, 1)])).toBe(
      'Grid with 100 rows and 3 columns. 4 cells selected.'
    );
  });

  it('describes whole row selections, which is what clicking a row gives', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(getGridA11ySummary(model, [new GridRange(null, 0, null, 0)])).toBe(
      'Grid with 100 rows and 3 columns. 1 row selected.'
    );
    expect(getGridA11ySummary(model, [new GridRange(null, 0, null, 4)])).toBe(
      'Grid with 100 rows and 3 columns. 5 rows selected.'
    );
  });

  it('describes whole column selections', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(getGridA11ySummary(model, [new GridRange(1, null, 1, null)])).toBe(
      'Grid with 100 rows and 3 columns. 1 column selected.'
    );
    expect(getGridA11ySummary(model, [new GridRange(0, null, 2, null)])).toBe(
      'Grid with 100 rows and 3 columns. 3 columns selected.'
    );
  });

  it('describes selecting the whole grid', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(
      getGridA11ySummary(model, [new GridRange(null, null, null, null)])
    ).toBe('Grid with 100 rows and 3 columns. Everything selected.');
  });
});

describe('createGridA11ySnapshot', () => {
  it('describes every column header and cell in the viewport', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(model, makeMetrics());

    expect(snapshot.rowCount).toBe(100);
    expect(snapshot.columnCount).toBe(3);
    expect(snapshot.columns.map(({ text }) => text)).toEqual(['0', '1', '2']);
    expect(snapshot.rows.map(({ row }) => row)).toEqual([0, 1]);
    expect(snapshot.rows[1].cells.map(({ text }) => text)).toEqual([
      '0,1',
      '1,1',
      '2,1',
    ]);
  });

  it('positions cells and headers relative to the top left of the canvas', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(model, makeMetrics());

    expect(snapshot.columns[1].rect).toEqual({
      x: ROW_HEADER_WIDTH + COLUMN_WIDTH,
      y: 0,
      width: COLUMN_WIDTH,
      height: HEADER_HEIGHT,
    });
    expect(snapshot.rows[1].cells[1].rect).toEqual({
      x: ROW_HEADER_WIDTH + COLUMN_WIDTH,
      y: HEADER_HEIGHT + ROW_HEIGHT,
      width: COLUMN_WIDTH,
      height: ROW_HEIGHT,
    });
  });

  it('leaves out columns that are collapsed to nothing on screen', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ hiddenColumns: [1] })
    );

    expect(snapshot.columns.map(({ column }) => column)).toEqual([0, 2]);
    expect(snapshot.rows[0].cells.map(({ text }) => text)).toEqual([
      '0,0',
      '2,0',
    ]);
  });

  it('describes the visible rows and columns', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(model, makeMetrics());

    expect(snapshot.description).toBe(
      'Grid with 100 rows and 3 columns. Showing rows 1 to 2, columns 0, 1, 2.'
    );
  });

  it('includes the selection in the description', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(model, makeMetrics(), [
      new GridRange(0, 0, 0, 0),
    ]);

    expect(snapshot.description).toBe(
      'Grid with 100 rows and 3 columns. 1 cell selected. Showing rows 1 to 2, columns 0, 1, 2.'
    );
  });
});
