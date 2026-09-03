import { createGridA11ySnapshot, getGridA11ySummary } from './GridA11yUtils';
import type GridMetrics from './GridMetrics';
import GridRange from './GridRange';
import MockGridModel from './MockGridModel';

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 30;
const ROW_HEADER_WIDTH = 30;
const MAX_X = 600;
const MAX_Y = 200;

/**
 * Make metrics for a viewport of the given size, laid out left to right and
 * top to bottom. Any column in `hiddenColumns` is collapsed to zero width, and
 * any row in `hiddenRows` to zero height.
 * Floating columns and rows are pinned to the edges of the grid, so their
 * coordinates take priority over any scrollable coordinates for the same
 * column or row. Scrollable items start after the frozen panes, as if the grid
 * were scrolled so nothing is hidden underneath them, until `leftOffset` or
 * `topOffset` scrolls them back under.
 */
function makeMetrics({
  columns = [0, 1, 2],
  rows = [0, 1],
  hiddenColumns = [] as number[],
  hiddenRows = [] as number[],
  floatingLeftColumns = [] as number[],
  floatingRightColumns = [] as number[],
  floatingTopRows = [] as number[],
  floatingBottomRows = [] as number[],
  leftOffset = 0,
  topOffset = 0,
  verticalBarWidth = 0,
  horizontalBarHeight = 0,
} = {}): GridMetrics {
  const allColumnWidths = new Map<number, number>();
  const allColumnXs = new Map<number, number>();
  const modelColumns = new Map<number, number>();
  const widthOf = (column: number): number =>
    hiddenColumns.includes(column) ? 0 : COLUMN_WIDTH;
  const setColumn = (column: number, columnX: number): void => {
    allColumnWidths.set(column, widthOf(column));
    allColumnXs.set(column, columnX);
    modelColumns.set(column, column);
  };
  const sumWidths = (items: number[]): number =>
    items.reduce((total, column) => total + widthOf(column), 0);
  const floatingLeftWidth = sumWidths(floatingLeftColumns);
  const floatingRightWidth = sumWidths(floatingRightColumns);

  let x = floatingLeftWidth - leftOffset;
  columns.forEach(column => {
    setColumn(column, x);
    x += widthOf(column);
  });

  x = 0;
  floatingLeftColumns.forEach(column => {
    setColumn(column, x);
    x += widthOf(column);
  });

  x = MAX_X;
  [...floatingRightColumns].reverse().forEach(column => {
    x -= widthOf(column);
    setColumn(column, x);
  });

  const allRowHeights = new Map<number, number>();
  const allRowYs = new Map<number, number>();
  const modelRows = new Map<number, number>();
  const heightOf = (row: number): number =>
    hiddenRows.includes(row) ? 0 : ROW_HEIGHT;
  const setRow = (row: number, rowY: number): void => {
    allRowHeights.set(row, heightOf(row));
    allRowYs.set(row, rowY);
    modelRows.set(row, row);
  };
  const sumHeights = (items: number[]): number =>
    items.reduce((total, row) => total + heightOf(row), 0);
  const floatingTopHeight = sumHeights(floatingTopRows);
  const floatingBottomHeight = sumHeights(floatingBottomRows);

  let y = floatingTopHeight - topOffset;
  rows.forEach(row => {
    setRow(row, y);
    y += heightOf(row);
  });

  y = 0;
  floatingTopRows.forEach(row => {
    setRow(row, y);
    y += heightOf(row);
  });

  y = MAX_Y;
  [...floatingBottomRows].reverse().forEach(row => {
    y -= heightOf(row);
    setRow(row, y);
  });

  return {
    visibleColumns: columns,
    visibleRows: rows,
    floatingColumns: [...floatingLeftColumns, ...floatingRightColumns],
    floatingRows: [...floatingTopRows, ...floatingBottomRows],
    allColumnWidths,
    allColumnXs,
    allRowHeights,
    allRowYs,
    modelColumns,
    modelRows,
    gridX: ROW_HEADER_WIDTH,
    gridY: HEADER_HEIGHT,
    columnHeaderHeight: HEADER_HEIGHT,
    width: ROW_HEADER_WIDTH + MAX_X,
    height: HEADER_HEIGHT + MAX_Y,
    verticalBarWidth,
    horizontalBarHeight,
    floatingLeftWidth,
    floatingRightWidth,
    floatingTopHeight,
    floatingBottomHeight,
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

  it('includes floating columns in left to right order', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 10,
      floatingLeftColumnCount: 1,
      floatingRightColumnCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [3, 4, 5],
        floatingLeftColumns: [0],
        floatingRightColumns: [9],
      })
    );

    expect(snapshot.columns.map(({ column }) => column)).toEqual([
      0, 3, 4, 5, 9,
    ]);
    expect(snapshot.rows[0].cells.map(({ text }) => text)).toEqual([
      '0,0',
      '3,0',
      '4,0',
      '5,0',
      '9,0',
    ]);
    expect(snapshot.description).toBe(
      'Grid with 100 rows and 10 columns. Showing rows 1 to 2, columns 0, 3, 4, 5, 9.'
    );
  });

  it('positions floating columns where they are pinned', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 10,
      floatingLeftColumnCount: 1,
      floatingRightColumnCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [3, 4, 5],
        floatingLeftColumns: [0],
        floatingRightColumns: [9],
      })
    );

    expect(snapshot.columns[0].rect).toEqual({
      x: ROW_HEADER_WIDTH,
      y: 0,
      width: COLUMN_WIDTH,
      height: HEADER_HEIGHT,
    });
    expect(snapshot.rows[1].cells[4].rect).toEqual({
      x: ROW_HEADER_WIDTH + MAX_X - COLUMN_WIDTH,
      y: HEADER_HEIGHT + ROW_HEIGHT,
      width: COLUMN_WIDTH,
      height: ROW_HEIGHT,
    });
  });

  it('describes a floating column once when it is also scrolled into view', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 10,
      floatingLeftColumnCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ columns: [0, 1, 2], floatingLeftColumns: [0] })
    );

    expect(snapshot.columns.map(({ column }) => column)).toEqual([0, 1, 2]);
    expect(snapshot.rows[0].cells.map(({ text }) => text)).toEqual([
      '0,0',
      '1,0',
      '2,0',
    ]);
  });

  it('leaves out floating columns that are collapsed to nothing on screen', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 10,
      floatingLeftColumnCount: 1,
      floatingRightColumnCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [3, 4, 5],
        floatingLeftColumns: [0],
        floatingRightColumns: [9],
        hiddenColumns: [0, 4],
      })
    );

    expect(snapshot.columns.map(({ column }) => column)).toEqual([3, 5, 9]);
    expect(snapshot.rows[0].cells.map(({ text }) => text)).toEqual([
      '3,0',
      '5,0',
      '9,0',
    ]);
  });

  it('includes floating rows in top to bottom order', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 3,
      floatingTopRowCount: 1,
      floatingBottomRowCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        rows: [3, 4],
        floatingTopRows: [0],
        floatingBottomRows: [99],
      })
    );

    expect(snapshot.rows.map(({ row }) => row)).toEqual([0, 3, 4, 99]);
    expect(snapshot.rows[3].cells.map(({ text }) => text)).toEqual([
      '0,99',
      '1,99',
      '2,99',
    ]);
  });

  it('positions floating rows where they are pinned', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 3,
      floatingTopRowCount: 1,
      floatingBottomRowCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        rows: [3, 4],
        floatingTopRows: [0],
        floatingBottomRows: [99],
      })
    );

    expect(snapshot.rows[0].cells[0].rect).toEqual({
      x: ROW_HEADER_WIDTH,
      y: HEADER_HEIGHT,
      width: COLUMN_WIDTH,
      height: ROW_HEIGHT,
    });
    expect(snapshot.rows[3].cells[0].rect).toEqual({
      x: ROW_HEADER_WIDTH,
      y: HEADER_HEIGHT + MAX_Y - ROW_HEIGHT,
      width: COLUMN_WIDTH,
      height: ROW_HEIGHT,
    });
  });

  it('describes a floating row once when it is also scrolled into view', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 3,
      floatingTopRowCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ rows: [0, 1], floatingTopRows: [0] })
    );

    expect(snapshot.rows.map(({ row }) => row)).toEqual([0, 1]);
  });

  it('leaves out rows that are collapsed to nothing on screen', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 3,
      floatingTopRowCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        rows: [3, 4, 5],
        floatingTopRows: [0],
        hiddenRows: [0, 4],
      })
    );

    expect(snapshot.rows.map(({ row }) => row)).toEqual([3, 5]);
  });

  it('clips cells and headers that run past the edges of the canvas', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 10 });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ columns: [0, 1, 2, 3, 4, 5, 6], leftOffset: 50 })
    );

    expect(snapshot.columns[0].rect).toEqual({
      x: ROW_HEADER_WIDTH,
      y: 0,
      width: COLUMN_WIDTH / 2,
      height: HEADER_HEIGHT,
    });
    expect(snapshot.columns[6].rect).toEqual({
      x: ROW_HEADER_WIDTH + MAX_X - COLUMN_WIDTH / 2,
      y: 0,
      width: COLUMN_WIDTH / 2,
      height: HEADER_HEIGHT,
    });
  });

  it('clips cells that run under the scroll bars', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 10 });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [0, 1, 2, 3, 4, 5],
        verticalBarWidth: COLUMN_WIDTH / 2,
        horizontalBarHeight: ROW_HEIGHT,
      })
    );

    const [lastCell] = snapshot.rows[0].cells.slice(-1);
    expect(lastCell.column).toBe(5);
    expect(lastCell.rect.width).toBe(COLUMN_WIDTH / 2);
    // The scroll bars only cover the grid content, not the headers
    expect(snapshot.columns[5].rect.width).toBe(COLUMN_WIDTH);
  });

  it('omits cells scrolled underneath the floating columns', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 10,
      floatingLeftColumnCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [3, 4, 5],
        floatingLeftColumns: [0],
        leftOffset: COLUMN_WIDTH,
      })
    );

    expect(snapshot.columns.map(({ column }) => column)).toEqual([0, 4, 5]);
    expect(snapshot.rows[0].cells.map(({ text }) => text)).toEqual([
      '0,0',
      '4,0',
      '5,0',
    ]);
  });

  it('clips cells partly scrolled underneath the floating columns', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 10,
      floatingLeftColumnCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [3, 4, 5],
        floatingLeftColumns: [0],
        leftOffset: COLUMN_WIDTH / 2,
      })
    );

    expect(snapshot.rows[0].cells[1]).toMatchObject({
      text: '3,0',
      rect: {
        x: ROW_HEADER_WIDTH + COLUMN_WIDTH,
        width: COLUMN_WIDTH / 2,
      },
    });
  });

  it('omits rows scrolled underneath the floating rows', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 3,
      floatingBottomRowCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        floatingBottomRows: [99],
      })
    );

    expect(snapshot.rows.map(({ row }) => row)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 99,
    ]);
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
