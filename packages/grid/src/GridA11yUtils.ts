import type GridMetrics from './GridMetrics';
import { type VisibleIndex } from './GridMetrics';
import type GridModel from './GridModel';
import GridRange from './GridRange';

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

  /** Header text. On column headers */
  header: 'data-grid-header',

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
 * @param rect The rect, relative to the top left of the grid content area
 * @param bounds The bounds the rect is painted in
 * @param metrics Metrics of the last render
 * @returns The visible part of the rect relative to the top left of the
 * canvas, or null if none of it can be interacted with
 */
function clipGridA11yRect(
  { x, y, width, height }: GridA11yRect,
  { left, top, right, bottom }: GridA11yBounds,
  metrics: GridMetrics
): GridA11yRect | null {
  const clippedX = Math.max(x, left);
  const clippedY = Math.max(y, top);
  const clippedWidth = Math.min(x + width, right) - clippedX;
  const clippedHeight = Math.min(y + height, bottom) - clippedY;
  if (clippedWidth <= 0 || clippedHeight <= 0) {
    return null;
  }

  return {
    x: metrics.gridX + clippedX,
    y: metrics.gridY + clippedY,
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
    metrics
  );
}

/**
 * Get the bounds of a bottom level column header, relative to the top left of the canvas.
 * @param metrics Metrics of the last render
 * @param column Visible column index of the header
 * @param isFloatingColumn Whether the column is frozen to the left or right
 * @returns The bounds of the header, or null if none of it is interactable
 */
function getColumnHeaderRect(
  metrics: GridMetrics,
  column: VisibleIndex,
  isFloatingColumn: boolean
): GridA11yRect | null {
  const x = metrics.allColumnXs.get(column);
  const width = metrics.allColumnWidths.get(column);
  if (x == null || width == null) {
    return null;
  }

  const { gridX, columnHeaderHeight, floatingLeftWidth, floatingRightWidth } =
    metrics;

  // Headers sit above the grid content, so the scroll bars never cover them
  const right = metrics.width - gridX;
  return clipGridA11yRect(
    // The bottom level header sits directly above the grid content
    { x, y: -columnHeaderHeight, width, height: columnHeaderHeight },
    {
      left: isFloatingColumn ? 0 : floatingLeftWidth,
      top: -columnHeaderHeight,
      right: isFloatingColumn ? right : right - floatingRightWidth,
      bottom: 0,
    },
    metrics
  );
}

/**
 * Get a description of the current selection.
 * @param ranges The selected ranges
 * @returns A sentence describing the selection
 */
function getSelectionDescription(ranges: readonly GridRange[]): string {
  const cellCount = GridRange.cellCount(ranges);
  if (!Number.isNaN(cellCount)) {
    return cellCount === 1
      ? '1 cell selected.'
      : `${cellCount} cells selected.`;
  }

  // A range with no countable cells is unbounded in one direction, i.e. whole
  // rows or whole columns, which is what clicking a row or a column header gives
  const rowCount = GridRange.rowCount(ranges);
  if (!Number.isNaN(rowCount)) {
    return rowCount === 1 ? '1 row selected.' : `${rowCount} rows selected.`;
  }

  const columnCount = GridRange.columnCount(ranges);
  if (!Number.isNaN(columnCount)) {
    return columnCount === 1
      ? '1 column selected.'
      : `${columnCount} columns selected.`;
  }

  return ranges.length === 1
    ? 'Everything selected.'
    : `${ranges.length} selection ranges selected.`;
}

/**
 * Get a brief description of the grid size and selection.
 * Only reads values the grid already has on hand, so it is cheap enough to
 * regenerate on every render.
 * @param model The model being displayed
 * @param selectedRanges The selected ranges
 * @returns A sentence describing the grid
 */
export function getGridA11ySummary(
  model: GridModel,
  selectedRanges: readonly GridRange[] = []
): string {
  const { rowCount, columnCount } = model;
  const size = `Grid with ${rowCount} rows and ${columnCount} columns.`;
  return selectedRanges.length > 0
    ? `${size} ${getSelectionDescription(selectedRanges)}`
    : size;
}

/**
 * Get the text and bounds of everything currently in the viewport.
 * Iterates every visible cell, so only generate it on demand.
 * @param model The model being displayed
 * @param metrics Metrics of the last render
 * @param selectedRanges The selected ranges
 * @returns The snapshot to render into the canvas fallback content
 */
export function createGridA11ySnapshot(
  model: GridModel,
  metrics: GridMetrics,
  selectedRanges: readonly GridRange[] = []
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

  snapshotColumns.forEach(column => {
    const modelColumn = metrics.modelColumns.get(column);
    const rect = getColumnHeaderRect(
      metrics,
      column,
      floatingColumns.has(column)
    );
    if (modelColumn == null || rect == null) {
      return;
    }
    columns.push({
      column,
      text: model.textForColumnHeader(modelColumn, 0) ?? '',
      rect,
    });
  });

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

  const { topVisible, bottomVisible } = metrics;
  const headers = columns.map(({ text }) => text).filter(text => text !== '');
  const visibleRows =
    rows.length > 0
      ? `Showing rows ${topVisible + 1} to ${bottomVisible + 1}`
      : 'Showing no rows';
  const viewport =
    headers.length > 0
      ? `${visibleRows}, columns ${headers.join(', ')}.`
      : `${visibleRows}.`;

  return {
    description: `${getGridA11ySummary(model, selectedRanges)} ${viewport}`,
    rowCount,
    columnCount,
    columns,
    rows,
  };
}
