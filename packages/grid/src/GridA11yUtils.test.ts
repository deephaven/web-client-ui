/* eslint class-methods-use-this: "off", max-classes-per-file: "off" */
import { type IColumnHeaderGroup } from './ColumnHeaderGroup';
import { createGridA11ySnapshot, getGridA11ySummary } from './GridA11yUtils';
import type GridMetrics from './GridMetrics';
import { type ModelIndex } from './GridMetrics';
import GridModel from './GridModel';
import GridRange from './GridRange';
import MockGridModel from './MockGridModel';
import { RangedSelection } from './RangedSelection';
import type { GetModel } from './Selection';

/** Wraps ranges in a `RangedSelection` so `getGridA11ySummary` / `createGridA11ySnapshot` receive the interface they expect. */
function rangedSelection(
  ranges: readonly GridRange[],
  model: MockGridModel
): RangedSelection {
  const getModel: GetModel = () => model;
  return new RangedSelection(ranges, getModel);
}

const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 30;
const ROW_HEADER_WIDTH = 30;
const MAX_X = 600;
const MAX_Y = 200;

type TestColumnGroup = { name: string; depth: number; children: number[] };

/** A model whose columns are grouped by the given groups, which are matched by identity */
class GroupedGridModel extends GridModel {
  private readonly groups: readonly (TestColumnGroup & IColumnHeaderGroup)[];

  private readonly numColumns: number;

  constructor(groups: TestColumnGroup[], columnCount = 3) {
    super();
    this.groups = groups.map(group => ({
      ...group,
      getVisibleRange: () => [
        Math.min(...group.children),
        Math.max(...group.children),
      ],
    }));
    this.numColumns = columnCount;
  }

  get rowCount(): number {
    return 100;
  }

  get columnCount(): number {
    return this.numColumns;
  }

  get columnHeaderMaxDepth(): number {
    return Math.max(0, ...this.groups.map(({ depth }) => depth)) + 1;
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return `${column},${row}`;
  }

  textForColumnHeader(column: ModelIndex, depth = 0): string | undefined {
    return depth === 0 ? `${column}` : this.findGroup(column, depth)?.name;
  }

  getColumnHeaderGroup(
    modelIndex: ModelIndex,
    depth: number
  ): IColumnHeaderGroup | undefined {
    return this.findGroup(modelIndex, depth);
  }

  protected findGroup(
    modelIndex: ModelIndex,
    depth: number
  ): IColumnHeaderGroup | undefined {
    return this.groups.find(
      group => group.depth === depth && group.children.includes(modelIndex)
    );
  }
}

/** Groups columns by header text alone, like models without group objects */
class TextGroupedGridModel extends GroupedGridModel {
  getColumnHeaderGroup(): IColumnHeaderGroup | undefined {
    return undefined;
  }
}

/**
 * Make metrics for a viewport of the given size, laid out left to right and
 * top to bottom. Any column in `hiddenColumns` is collapsed to zero width, and
 * any row in `hiddenRows` to zero height.
 * Floating columns and rows are pinned to the edges of the grid, so their
 * coordinates take priority over any scrollable coordinates for the same
 * column or row. Scrollable items start after the frozen panes, as if the grid
 * were scrolled so nothing is hidden underneath them, until `leftOffset` or
 * `topOffset` scrolls them back under.
 * `barHeight` adds a bar between the column headers and the grid content, like
 * the IrisGrid filter bar. `columnWidths` overrides the width of any column.
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
  columnHeaderMaxDepth = 1,
  barHeight = 0,
  columnWidths = {} as Record<number, number>,
} = {}): GridMetrics {
  const allColumnWidths = new Map<number, number>();
  const allColumnXs = new Map<number, number>();
  const modelColumns = new Map<number, number>();
  const widthOf = (column: number): number =>
    hiddenColumns.includes(column) ? 0 : columnWidths[column] ?? COLUMN_WIDTH;
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

  const gridY = columnHeaderMaxDepth * HEADER_HEIGHT + barHeight;
  return {
    visibleColumns: columns,
    visibleRows: rows,
    floatingColumns: [...floatingLeftColumns, ...floatingRightColumns],
    floatingRows: [...floatingTopRows, ...floatingBottomRows],
    floatingLeftColumnCount: floatingLeftColumns.length,
    allColumnWidths,
    allColumnXs,
    allRowHeights,
    allRowYs,
    modelColumns,
    modelRows,
    gridX: ROW_HEADER_WIDTH,
    gridY,
    columnHeaderHeight: HEADER_HEIGHT,
    columnHeaderMaxDepth,
    width: ROW_HEADER_WIDTH + MAX_X,
    height: gridY + MAX_Y,
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
    expect(
      getGridA11ySummary(
        model,
        rangedSelection([new GridRange(0, 0, 0, 0)], model)
      )
    ).toBe('Grid with 100 rows and 3 columns. 1 cell selected.');
    expect(
      getGridA11ySummary(
        model,
        rangedSelection([new GridRange(0, 0, 1, 1)], model)
      )
    ).toBe('Grid with 100 rows and 3 columns. 4 cells selected.');
  });

  it('describes whole row selections, which is what clicking a row gives', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(
      getGridA11ySummary(
        model,
        rangedSelection([new GridRange(null, 0, null, 0)], model)
      )
    ).toBe('Grid with 100 rows and 3 columns. 1 row selected.');
    expect(
      getGridA11ySummary(
        model,
        rangedSelection([new GridRange(null, 0, null, 4)], model)
      )
    ).toBe('Grid with 100 rows and 3 columns. 5 rows selected.');
  });

  it('describes whole column selections', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(
      getGridA11ySummary(
        model,
        rangedSelection([new GridRange(1, null, 1, null)], model)
      )
    ).toBe('Grid with 100 rows and 3 columns. 1 column selected.');
    expect(
      getGridA11ySummary(
        model,
        rangedSelection([new GridRange(0, null, 2, null)], model)
      )
    ).toBe('Grid with 100 rows and 3 columns. 3 columns selected.');
  });

  it('describes selecting the whole grid', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    expect(
      getGridA11ySummary(
        model,
        rangedSelection([new GridRange(null, null, null, null)], model)
      )
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

  it('describes a single visible row', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(model, makeMetrics({ rows: [4] }));

    expect(snapshot.description).toBe(
      'Grid with 100 rows and 3 columns. Showing row 5, columns 0, 1, 2.'
    );
  });

  it('describes an empty viewport', () => {
    const model = new MockGridModel({ rowCount: 0, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(model, makeMetrics({ rows: [] }));

    expect(snapshot.description).toBe(
      'Grid with 0 rows and 3 columns. Showing no rows, columns 0, 1, 2.'
    );
  });

  it('describes rows that are not contiguous as separate ranges', () => {
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

    expect(snapshot.description).toBe(
      'Grid with 100 rows and 3 columns. Showing rows 1, 4 to 5, and 100, columns 0, 1, 2.'
    );
  });

  it('joins two ranges of rows without a comma', () => {
    const model = new MockGridModel({
      rowCount: 100,
      columnCount: 3,
      floatingBottomRowCount: 1,
    });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ rows: [3, 4], floatingBottomRows: [99] })
    );

    expect(snapshot.description).toBe(
      'Grid with 100 rows and 3 columns. Showing rows 4 to 5 and 100, columns 0, 1, 2.'
    );
  });

  it('leaves rows collapsed to nothing out of the description', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ rows: [0, 1, 2, 3], hiddenRows: [2] })
    );

    expect(snapshot.description).toBe(
      'Grid with 100 rows and 3 columns. Showing rows 1 to 2 and 4, columns 0, 1, 2.'
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
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics(),
      rangedSelection([new GridRange(0, 0, 0, 0)], model)
    );

    expect(snapshot.description).toBe(
      'Grid with 100 rows and 3 columns. 1 cell selected. Showing rows 1 to 2, columns 0, 1, 2.'
    );
  });
});

describe('createGridA11ySnapshot column header groups', () => {
  it('has a single header row and no groups when the model has none', () => {
    const model = new MockGridModel({ rowCount: 100, columnCount: 3 });
    const snapshot = createGridA11ySnapshot(model, makeMetrics());

    expect(snapshot.headerRowCount).toBe(1);
    expect(snapshot.columnGroups).toEqual([]);
  });

  it('describes a group spanning the columns it covers, above the bottom level headers', () => {
    const model = new GroupedGridModel([
      { name: 'A', depth: 1, children: [1, 2] },
    ]);
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ columnHeaderMaxDepth: 2 })
    );

    expect(snapshot.headerRowCount).toBe(2);
    // Column 0 has no group, so nothing is described above it
    expect(snapshot.columnGroups).toEqual([
      {
        depth: 1,
        groups: [
          {
            startColumn: 1,
            endColumn: 2,
            span: 2,
            depth: 1,
            text: 'A',
            rect: {
              x: ROW_HEADER_WIDTH + COLUMN_WIDTH,
              y: 0,
              width: 2 * COLUMN_WIDTH,
              height: HEADER_HEIGHT,
            },
          },
        ],
      },
    ]);
    expect(snapshot.columns[1].rect.y).toBe(HEADER_HEIGHT);
  });

  it('orders group rows top to bottom', () => {
    const model = new GroupedGridModel([
      { name: 'All', depth: 2, children: [0, 1, 2] },
      { name: 'YandZ', depth: 1, children: [1, 2] },
    ]);
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ columnHeaderMaxDepth: 3 })
    );

    expect(
      snapshot.columnGroups.map(({ depth, groups }) => ({
        depth,
        groups: groups.map(({ text, rect }) => ({ text, y: rect.y })),
      }))
    ).toEqual([
      { depth: 2, groups: [{ text: 'All', y: 0 }] },
      { depth: 1, groups: [{ text: 'YandZ', y: HEADER_HEIGHT }] },
    ]);
    expect(snapshot.columns[0].rect.y).toBe(2 * HEADER_HEIGHT);
  });

  it('keeps adjacent groups with the same name separate', () => {
    const model = new GroupedGridModel([
      { name: 'A', depth: 1, children: [0] },
      { name: 'A', depth: 1, children: [1, 2] },
    ]);
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ columnHeaderMaxDepth: 2 })
    );

    expect(
      snapshot.columnGroups[0].groups.map(({ startColumn, span }) => ({
        startColumn,
        span,
      }))
    ).toEqual([
      { startColumn: 0, span: 1 },
      { startColumn: 1, span: 2 },
    ]);
  });

  it('splits a group at the frozen column boundary', () => {
    const model = new GroupedGridModel(
      [{ name: 'A', depth: 1, children: [0, 1, 2, 3] }],
      10
    );
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [2, 3],
        floatingLeftColumns: [0],
        columnHeaderMaxDepth: 2,
      })
    );

    expect(snapshot.columnGroups[0].groups).toEqual([
      expect.objectContaining({
        startColumn: 0,
        span: 1,
        rect: {
          x: ROW_HEADER_WIDTH,
          y: 0,
          width: COLUMN_WIDTH,
          height: HEADER_HEIGHT,
        },
      }),
      expect.objectContaining({
        startColumn: 2,
        endColumn: 3,
        span: 2,
        rect: {
          x: ROW_HEADER_WIDTH + COLUMN_WIDTH,
          y: 0,
          width: 2 * COLUMN_WIDTH,
          height: HEADER_HEIGHT,
        },
      }),
    ]);
  });

  it('keeps frozen and scrolling groups whole when a scrolling column runs under the frozen columns', () => {
    const model = new GroupedGridModel(
      [
        { name: 'Frozen', depth: 1, children: [0, 1] },
        { name: 'Scrolling', depth: 1, children: [2, 3] },
      ],
      10
    );
    // Column 2 starts left of frozen column 1, but is only visible right of the frozen pane
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [2, 3],
        floatingLeftColumns: [0, 1],
        columnWidths: { 2: 3 * COLUMN_WIDTH },
        leftOffset: 1.5 * COLUMN_WIDTH,
        columnHeaderMaxDepth: 2,
      })
    );

    expect(snapshot.columns.map(({ column }) => column)).toEqual([0, 1, 2, 3]);
    expect(
      snapshot.columnGroups[0].groups.map(({ text, span, rect }) => ({
        text,
        span,
        x: rect.x,
        width: rect.width,
      }))
    ).toEqual([
      { text: 'Frozen', span: 2, x: ROW_HEADER_WIDTH, width: 2 * COLUMN_WIDTH },
      {
        text: 'Scrolling',
        span: 2,
        x: ROW_HEADER_WIDTH + 2 * COLUMN_WIDTH,
        width: 2.5 * COLUMN_WIDTH,
      },
    ]);
  });

  it('clips groups that run past the edges of the canvas', () => {
    const model = new GroupedGridModel(
      [{ name: 'A', depth: 1, children: [0, 1] }],
      10
    );
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({
        columns: [0, 1, 2, 3, 4, 5, 6],
        leftOffset: COLUMN_WIDTH / 2,
        columnHeaderMaxDepth: 2,
      })
    );

    expect(snapshot.columnGroups[0].groups[0].rect).toEqual({
      x: ROW_HEADER_WIDTH,
      y: 0,
      width: COLUMN_WIDTH * 1.5,
      height: HEADER_HEIGHT,
    });
  });

  it('keeps groups with the same text apart when a hidden column of another group is between them', () => {
    const model = new TextGroupedGridModel([
      { name: 'A', depth: 1, children: [0] },
      { name: 'B', depth: 1, children: [1] },
      { name: 'A', depth: 1, children: [2] },
    ]);
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ hiddenColumns: [1], columnHeaderMaxDepth: 2 })
    );

    expect(
      snapshot.columnGroups[0].groups.map(({ text, startColumn, span }) => ({
        text,
        startColumn,
        span,
      }))
    ).toEqual([
      { text: 'A', startColumn: 0, span: 1 },
      { text: 'A', startColumn: 2, span: 1 },
    ]);
  });

  it('leaves out columns collapsed to nothing on screen', () => {
    const model = new GroupedGridModel([
      { name: 'A', depth: 1, children: [0, 1] },
      { name: 'B', depth: 1, children: [2] },
    ]);
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ hiddenColumns: [1, 2], columnHeaderMaxDepth: 2 })
    );

    expect(snapshot.columnGroups[0].groups).toEqual([
      expect.objectContaining({
        text: 'A',
        startColumn: 0,
        endColumn: 0,
        span: 1,
      }),
    ]);
  });

  it('positions headers where they are painted when a bar sits above the grid content', () => {
    const barHeight = 40;
    const model = new GroupedGridModel([
      { name: 'A', depth: 1, children: [0, 1, 2] },
    ]);
    const snapshot = createGridA11ySnapshot(
      model,
      makeMetrics({ columnHeaderMaxDepth: 2, barHeight })
    );

    expect(snapshot.columnGroups[0].groups[0].rect.y).toBe(0);
    expect(snapshot.columns[0].rect).toEqual({
      x: ROW_HEADER_WIDTH,
      y: HEADER_HEIGHT,
      width: COLUMN_WIDTH,
      height: HEADER_HEIGHT,
    });
    expect(snapshot.rows[0].cells[0].rect.y).toBe(
      2 * HEADER_HEIGHT + barHeight
    );
  });
});
