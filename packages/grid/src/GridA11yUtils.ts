import type GridMetrics from './GridMetrics';
import { type ModelIndex, type VisibleIndex } from './GridMetrics';
import type GridModel from './GridModel';
import GridUtils from './GridUtils';
import type { Selection } from './Selection';

/**
 * Attributes on the accessibility snapshot that Grid renders into its canvas
 * fallback content. External tooling locates grid contents through these, so
 * treat them as a public contract.
 */
export const GRID_A11Y_ATTRIBUTES = {
  /** On the button that generates a snapshot */
  describe: 'data-grid-a11y-describe',

  /** On the root of a generated snapshot */
  snapshot: 'data-grid-a11y-snapshot',

  /** Visible column index. On column headers and cells */
  column: 'data-grid-column',

  /** Visible row index. On cells */
  row: 'data-grid-row',

  /** Header text. On bottom level column headers */
  header: 'data-grid-header',

  /** Header group text. On column header groups */
  headerGroup: 'data-grid-header-group',

  /** Header depth, 0 for bottom level headers. On column headers and column header groups */
  depth: 'data-grid-depth',

  /** Bounds as `x,y,width,height`, relative to the top left of the canvas, in CSS pixels */
  rect: 'data-grid-rect',
} as const;

/** The attribute names used by the accessibility snapshot */
export type GridA11yAttributes = typeof GRID_A11Y_ATTRIBUTES;

/** A rectangle relative to the top left of the grid canvas, in CSS pixels */
export type GridA11yRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A column header in an accessibility snapshot */
export type GridA11yColumnSnapshot = {
  column: VisibleIndex;
  text: string;
  rect: GridA11yRect;
};

/** A column header group spanning one or more columns in an accessibility snapshot */
export type GridA11yColumnGroupSnapshot = {
  /** First visible column the group covers on screen */
  startColumn: VisibleIndex;

  /** Last visible column the group covers on screen */
  endColumn: VisibleIndex;

  /** Number of snapshot columns the group covers */
  span: number;

  depth: number;
  text: string;
  rect: GridA11yRect;
};

/** A row of column header groups at one depth in an accessibility snapshot */
export type GridA11yColumnGroupRowSnapshot = {
  depth: number;
  groups: readonly GridA11yColumnGroupSnapshot[];
};

/** A cell in an accessibility snapshot */
export type GridA11yCellSnapshot = {
  column: VisibleIndex;
  text: string;
  rect: GridA11yRect;
};

/** A row of cells in an accessibility snapshot */
export type GridA11yRowSnapshot = {
  row: VisibleIndex;
  cells: readonly GridA11yCellSnapshot[];
};

/**
 * The grid viewport at a point in time. Generated on demand rather than on
 * every frame, as walking the viewport is far too expensive to do while
 * scrolling.
 */
export type GridA11ySnapshot = {
  /** A sentence describing the grid size, selection, and viewport */
  description: string;

  /** The number of rows in the whole grid, not just the viewport */
  rowCount: number;

  /** The number of columns in the whole grid, not just the viewport */
  columnCount: number;

  /** The number of column header rows, including the bottom level headers */
  headerRowCount: number;

  /**
   * Column header group rows in the viewport, top to bottom (deepest first).
   * Depths with no groups in the viewport are left out.
   */
  columnGroups: readonly GridA11yColumnGroupRowSnapshot[];

  /** Bottom level column headers */
  columns: readonly GridA11yColumnSnapshot[];
  rows: readonly GridA11yRowSnapshot[];
};

/**
 * Format a rect for the `data-grid-rect` attribute.
 * @param rect The rect to format
 * @returns The rect as `x,y,width,height`
 */
export function formatGridA11yRect({
  x,
  y,
  width,
  height,
}: GridA11yRect): string {
  return `${x},${y},${width},${height}`;
}

/**
 * The area an item may be painted in, relative to the top left of the grid
 * content area.
 */
type GridA11yBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/**
 * Clip a rect to the bounds it is painted in and move it onto the canvas.
 * @param rect The rect, relative to the origin
 * @param bounds The bounds the rect is painted in, relative to the origin
 * @param origin Where the origin sits, relative to the top left of the canvas
 * @returns The visible part of the rect relative to the top left of the
 * canvas, or null if none of it can be interacted with
 */
function clipGridA11yRect(
  { x, y, width, height }: GridA11yRect,
  { left, top, right, bottom }: GridA11yBounds,
  origin: { x: number; y: number }
): GridA11yRect | null {
  const clippedX = Math.max(x, left);
  const clippedY = Math.max(y, top);
  const clippedWidth = Math.min(x + width, right) - clippedX;
  const clippedHeight = Math.min(y + height, bottom) - clippedY;
  if (clippedWidth <= 0 || clippedHeight <= 0) {
    return null;
  }

  return {
    x: origin.x + clippedX,
    y: origin.y + clippedY,
    width: clippedWidth,
    height: clippedHeight,
  };
}

/**
 * Get the bounds of a cell, relative to the top left of the canvas.
 * @param metrics Metrics of the last render
 * @param column Visible column index of the cell
 * @param row Visible row index of the cell
 * @param isFloatingColumn Whether the column is frozen to the left or right
 * @param isFloatingRow Whether the row is frozen to the top or bottom
 * @returns The bounds of the cell, or null if none of it is interactable
 */
function getCellRect(
  metrics: GridMetrics,
  column: VisibleIndex,
  row: VisibleIndex,
  isFloatingColumn: boolean,
  isFloatingRow: boolean
): GridA11yRect | null {
  const x = metrics.allColumnXs.get(column);
  const y = metrics.allRowYs.get(row);
  const width = metrics.allColumnWidths.get(column);
  const height = metrics.allRowHeights.get(row);
  if (x == null || y == null || width == null || height == null) {
    return null;
  }

  const {
    gridX,
    gridY,
    verticalBarWidth,
    horizontalBarHeight,
    floatingLeftWidth,
    floatingRightWidth,
    floatingTopHeight,
    floatingBottomHeight,
  } = metrics;

  // Scrollable cells run under the headers, the frozen panes, and the scroll
  // bars, all of which are painted over them and take the click instead
  const right = metrics.width - gridX - verticalBarWidth;
  const bottom = metrics.height - gridY - horizontalBarHeight;
  return clipGridA11yRect(
    { x, y, width, height },
    {
      left: isFloatingColumn ? 0 : floatingLeftWidth,
      top: isFloatingRow ? 0 : floatingTopHeight,
      right: isFloatingColumn ? right : right - floatingRightWidth,
      bottom: isFloatingRow ? bottom : bottom - floatingBottomHeight,
    },
    { x: gridX, y: gridY }
  );
}

/**
 * Get the bounds of a column header or header group, relative to the top left of the canvas.
 * @param metrics Metrics of the last render
 * @param x Left of the header, relative to the left of the grid content area
 * @param width Width of the header
 * @param depth Depth of the header, 0 for bottom level headers
 * @param isFloatingColumn Whether the header is frozen to the left or right
 * @returns The bounds of the header, or null if none of it is interactable
 */
function getColumnHeaderRect(
  metrics: GridMetrics,
  x: number,
  width: number,
  depth: number,
  isFloatingColumn: boolean
): GridA11yRect | null {
  const {
    gridX,
    columnHeaderHeight,
    columnHeaderMaxDepth,
    floatingLeftWidth,
    floatingRightWidth,
  } = metrics;

  // Header rows are painted down from the top of the canvas, not up from the
  // grid content, as bars such as the IrisGrid filter bar sit between the two
  const y = (columnHeaderMaxDepth - depth - 1) * columnHeaderHeight;
  // Headers sit above the grid content, so the scroll bars never cover them
  const right = metrics.width - gridX;
  return clipGridA11yRect(
    { x, y, width, height: columnHeaderHeight },
    {
      left: isFloatingColumn ? 0 : floatingLeftWidth,
      top: y,
      right: isFloatingColumn ? right : right - floatingRightWidth,
      bottom: y + columnHeaderHeight,
    },
    { x: gridX, y: 0 }
  );
}

/** A bottom level header in the snapshot, along with what groups are built from */
type GridA11yHeaderColumn = {
  column: VisibleIndex;
  modelColumn: ModelIndex;
  isFloating: boolean;
};

/**
 * Get the column header groups at one depth, built from the bottom level
 * headers in the snapshot so each group spans whole snapshot columns.
 * @param model The model being displayed
 * @param metrics Metrics of the last render
 * @param headerColumns The bottom level headers in the snapshot, in on screen order
 * @param depth The depth to get the groups at, 1 or more
 * @returns The groups at this depth, left to right
 */
function getColumnGroups(
  model: GridModel,
  metrics: GridMetrics,
  headerColumns: readonly GridA11yHeaderColumn[],
  depth: number
): GridA11yColumnGroupSnapshot[] {
  const groups: GridA11yColumnGroupSnapshot[] = [];
  const runs: GridA11yHeaderColumn[][] = [];
  headerColumns.forEach(headerColumn => {
    const run = runs.at(-1);
    const prev = run?.at(-1);
    // Frozen columns are painted separately from the scrolling columns, so a
    // group split by the frozen boundary is two boxes on screen
    if (
      run != null &&
      prev != null &&
      prev.isFloating === headerColumn.isFloating &&
      GridUtils.isSameColumnGroupAtDepth(
        model,
        depth,
        prev.modelColumn,
        headerColumn.modelColumn
      )
    ) {
      run.push(headerColumn);
    } else {
      runs.push([headerColumn]);
    }
  });

  runs.forEach(run => {
    const first = run[0];
    const last = run[run.length - 1];
    // Columns without a group at this depth have no text, and nothing is painted there
    const text = model.textForColumnHeader(first.modelColumn, depth);
    const left = metrics.allColumnXs.get(first.column);
    const lastX = metrics.allColumnXs.get(last.column);
    const lastWidth = metrics.allColumnWidths.get(last.column);
    if (text == null || left == null || lastX == null || lastWidth == null) {
      return;
    }
    const rect = getColumnHeaderRect(
      metrics,
      left,
      lastX + lastWidth - left,
      depth,
      first.isFloating
    );
    if (rect == null) {
      return;
    }
    groups.push({
      startColumn: first.column,
      endColumn: last.column,
      span: run.length,
      depth,
      text,
      rect,
    });
  });
  return groups;
}

/**
 * Get a brief description of the grid size and selection.
 * Only reads values the grid already has on hand, so it is cheap enough to
 * regenerate on every render.
 * @param model The model being displayed
 * @param selection The current selection, or `null` when none
 * @returns A sentence describing the grid
 */
export function getGridA11ySummary(
  model: GridModel,
  selection: Selection | null = null
): string {
  const { rowCount, columnCount } = model;
  const size = `Grid with ${rowCount} rows and ${columnCount} columns.`;
  return selection != null && !selection.isEmpty()
    ? `${size} ${selection.describe()}`
    : size;
}

/**
 * Describe which rows are on screen. Consecutive rows are collapsed into a
 * range, so floating rows read as separate groups instead of being lumped in
 * with the scrolled rows between them.
 * @param rows The visible rows, in any order
 * @returns A sentence fragment such as `Showing rows 1 to 20 and 100`
 */
function getVisibleRowsDescription(rows: readonly VisibleIndex[]): string {
  const ranges: Array<[number, number]> = [];
  [...rows]
    .sort((a, b) => a - b)
    .forEach(row => {
      const lastRange = ranges.at(-1);
      if (lastRange != null && row === lastRange[1] + 1) {
        lastRange[1] = row;
      } else {
        ranges.push([row, row]);
      }
    });

  if (ranges.length === 0) {
    return 'Showing no rows';
  }

  // Row indexes are zero based, but the row numbers the user sees are not
  const descriptions = ranges.map(([start, end]) =>
    start === end ? `${start + 1}` : `${start + 1} to ${end + 1}`
  );
  const label = rows.length === 1 ? 'row' : 'rows';
  if (descriptions.length === 1) {
    return `Showing ${label} ${descriptions[0]}`;
  }
  if (descriptions.length === 2) {
    return `Showing ${label} ${descriptions[0]} and ${descriptions[1]}`;
  }
  return `Showing ${label} ${descriptions
    .slice(0, -1)
    .join(', ')}, and ${descriptions.at(-1)}`;
}

/**
 * Get the text and bounds of everything currently in the viewport.
 * Iterates every visible cell, so only generate it on demand.
 * @param model The model being displayed
 * @param metrics Metrics of the last render
 * @param selection The current selection, or `null` when none
 * @returns The snapshot to render into the canvas fallback content
 */
export function createGridA11ySnapshot(
  model: GridModel,
  metrics: GridMetrics,
  selection: Selection | null = null
): GridA11ySnapshot {
  const { rowCount, columnCount } = model;
  const columns: GridA11yColumnSnapshot[] = [];
  const rows: GridA11yRowSnapshot[] = [];

  const isHiddenColumn = (column: VisibleIndex): boolean =>
    (metrics.allColumnWidths.get(column) ?? 0) <= 0;
  const isHiddenRow = (row: VisibleIndex): boolean =>
    (metrics.allRowHeights.get(row) ?? 0) <= 0;

  const floatingColumns = new Set(metrics.floatingColumns);
  const floatingRows = new Set(metrics.floatingRows);

  // Hidden columns and rows are collapsed to nothing on screen, so leave them
  // out rather than describing something the user cannot see
  // Floating columns/rows are pinned to the edges of the grid and can also
  // appear in the visible ranges, so dedupe them and describe everything in
  // the order it appears on screen
  const snapshotColumns = [
    ...new Set([...metrics.floatingColumns, ...metrics.visibleColumns]),
  ]
    .filter(column => !isHiddenColumn(column))
    .sort(
      (a, b) =>
        (metrics.allColumnXs.get(a) ?? 0) - (metrics.allColumnXs.get(b) ?? 0)
    );

  const snapshotRows = [
    ...new Set([...metrics.floatingRows, ...metrics.visibleRows]),
  ]
    .filter(row => !isHiddenRow(row))
    .sort(
      (a, b) => (metrics.allRowYs.get(a) ?? 0) - (metrics.allRowYs.get(b) ?? 0)
    );

  const headerColumns: GridA11yHeaderColumn[] = [];
  snapshotColumns.forEach(column => {
    const modelColumn = metrics.modelColumns.get(column);
    const x = metrics.allColumnXs.get(column);
    const width = metrics.allColumnWidths.get(column);
    if (modelColumn == null || x == null || width == null) {
      return;
    }
    const isFloating = floatingColumns.has(column);
    const rect = getColumnHeaderRect(metrics, x, width, 0, isFloating);
    if (rect == null) {
      return;
    }
    headerColumns.push({ column, modelColumn, isFloating });
    columns.push({
      column,
      text: model.textForColumnHeader(modelColumn, 0) ?? '',
      rect,
    });
  });

  const headerRowCount = Math.max(1, metrics.columnHeaderMaxDepth);
  const columnGroups: GridA11yColumnGroupRowSnapshot[] = [];
  for (let depth = headerRowCount - 1; depth >= 1; depth -= 1) {
    const groups = getColumnGroups(model, metrics, headerColumns, depth);
    if (groups.length > 0) {
      columnGroups.push({ depth, groups });
    }
  }

  snapshotRows.forEach(row => {
    const modelRow = metrics.modelRows.get(row);
    if (modelRow == null) {
      return;
    }
    const isFloatingRow = floatingRows.has(row);
    const cells: GridA11yCellSnapshot[] = [];
    snapshotColumns.forEach(column => {
      const modelColumn = metrics.modelColumns.get(column);
      const rect = getCellRect(
        metrics,
        column,
        row,
        floatingColumns.has(column),
        isFloatingRow
      );
      if (modelColumn == null || rect == null) {
        return;
      }
      cells.push({
        column,
        text: model.textForCell(modelColumn, modelRow),
        rect,
      });
    });
    // A row with nothing left after clipping is entirely covered by the frozen
    // panes or the scroll bars
    if (cells.length > 0) {
      rows.push({ row, cells });
    }
  });

  const headers = columns.map(({ text }) => text).filter(text => text !== '');
  const visibleRows = getVisibleRowsDescription(rows.map(({ row }) => row));
  const viewport =
    headers.length > 0
      ? `${visibleRows}, columns ${headers.join(', ')}.`
      : `${visibleRows}.`;

  return {
    description: `${getGridA11ySummary(model, selection)} ${viewport}`,
    rowCount,
    columnCount,
    headerRowCount,
    columnGroups,
    columns,
    rows,
  };
}
