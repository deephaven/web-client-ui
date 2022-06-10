import clamp from 'lodash.clamp';
import GridModel from './GridModel';
import type {
  GridMetrics,
  BoxCoordinates,
  Coordinate,
  CoordinateMap,
  VisibleIndex,
  VisibleToModelMap,
  ModelIndex,
  ModelSizeMap,
  MoveOperation,
  SizeMap,
} from './GridMetrics';
import GridUtils from './GridUtils';
import { GridFont, GridTheme } from './GridTheme';
import { isExpandableGridModel } from './ExpandableGridModel';

/* eslint class-methods-use-this: "off" */
/* eslint react/destructuring-assignment: "off" */

export interface GridMetricState {
  // The top/left cell of the scrolled viewport
  left: VisibleIndex;
  top: VisibleIndex;

  // The scroll offset within the top/left of the viewport
  leftOffset: Coordinate;
  topOffset: Coordinate;

  // Width and height of the total canvas area
  width: number;
  height: number;

  // The canvas context
  context: CanvasRenderingContext2D;

  // The grid theme
  theme: GridTheme;

  // The model used by the grid
  model: GridModel;

  // Moved columns/rows in the grid
  movedColumns: MoveOperation[];
  movedRows: MoveOperation[];

  // Whether the scrollbars are currently being dragged
  isDraggingHorizontalScrollBar: boolean;
  isDraggingVerticalScrollBar: boolean;
}

/**
 * Retrieve a value from a map. If the value is not found and no default value is provided, throw.
 * Use when the value _must_ be present
 * @param map The map to get the value from
 * @param key The key to fetch the value for
 * @param defaultValue A default value to set if the key is not present
 * @returns The value set for that key
 */
export function getOrThrow<K, V>(
  map: Map<K, V>,
  key: K,
  defaultValue: V | undefined = undefined
): V {
  const value = map.get(key) ?? defaultValue;
  if (value !== undefined) {
    return value;
  }

  throw new Error(`Missing value for key ${key}`);
}

/**
 * Trim the provided map in place. Trims oldest inserted items down to the target size if the cache size is exceeded.
 * Instead of trimming one item on every tick, we trim half the items so there isn't a cache clear on every new item.
 * @param map The map to trim
 * @param cacheSize The maximum number of elements to cache
 * @param targetSize The number of elements to reduce the cache down to if `cacheSize` is exceeded
 */
export function trimMap(
  map: Map<unknown, unknown>,
  cacheSize = GridMetricCalculator.CACHE_SIZE,
  targetSize = Math.floor(cacheSize / 2)
): void {
  if (map.size > cacheSize) {
    const iter = map.keys();
    while (map.size > targetSize) {
      map.delete(iter.next().value);
    }
  }
}

/**
 * Get the coordinates of floating items in one dimension.
 * Can be used for getting the y coordinates of floating rows, or x coordinates of floating columns, calculated using the `sizeMap` passed in.
 * @param startCount The number of floating items at the start (ie. `floatingTopRowCount` for rows, `floatingLeftColumnCount` for columns)
 * @param endCount The number of floating items at the end (ie. `floatingBottomRowCount` for rows, `floatingRightColumnCount` for columns)
 * @param totalCount Total number of items in this dimension (ie. `rowCount` for rows, `columnCount` for columns)
 * @param max The max coordinate value (ie. `maxY` for rows, `maxX` for columns)
 * @param sizeMap Map from index to size of item (ie. `rowHeightMap` for rows, `columnWidthMap` for columns)
 */
export function getFloatingCoordinates(
  startCount: number,
  endCount: number,
  totalCount: number,
  max: number,
  sizeMap: SizeMap
): CoordinateMap {
  const coordinates = new Map();
  let x = 0;
  for (let i = 0; i < startCount && i < totalCount; i += 1) {
    coordinates.set(i, x);
    x += getOrThrow(sizeMap, i);
  }

  x = max;
  for (let i = 0; i < endCount && totalCount - i - 1 >= 0; i += 1) {
    x -= getOrThrow(sizeMap, totalCount - i - 1);
    coordinates.set(totalCount - i - 1, x);
  }
  return coordinates;
}

/**
 * Class to calculate all the metrics for drawing a grid.
 * Call getMetrics() with the state to get the full metrics.
 * Override this class and override the individual methods to provide additional functionality.
 */
export class GridMetricCalculator {
  /** The size of the caches this calculator stores */
  static CACHE_SIZE = 10000;

  /** The maximum column width as a percentage of the full grid */
  static MAX_COLUMN_WIDTH = 0.8;

  /** User set column widths */
  protected userColumnWidths: ModelSizeMap;

  /** User set row heights */
  protected userRowHeights: ModelSizeMap;

  /** Calculated column widths based on cell contents */
  protected calculatedColumnWidths: ModelSizeMap;

  /** Calculated row heights based on cell contents */
  protected calculatedRowHeights: ModelSizeMap;

  /** Cache of fonts to estimated width of one char */
  protected fontWidths: Map<string, number>;

  /** Map from visible index to model index for rows (e.g. reversing movedRows operations) */
  protected modelRows: VisibleToModelMap;

  /** Map from visible index to model index for columns (e.g. reversing movedColumns operations) */
  protected modelColumns: VisibleToModelMap;

  /** List of moved row operations. Need to track the previous value so we know if modelRows needs to be cleared. */
  protected movedRows: MoveOperation[];

  /** List of moved column operations. Need to track the previous value so we know if modelColumns needs to be cleared. */
  protected movedColumns: MoveOperation[];

  constructor({
    userColumnWidths = new Map(),
    userRowHeights = new Map(),
    calculatedColumnWidths = new Map(),
    calculatedRowHeights = new Map(),
    fontWidths = new Map(),
    modelRows = new Map(),
    modelColumns = new Map(),
    movedRows = [] as MoveOperation[],
    movedColumns = [] as MoveOperation[],
  } = {}) {
    this.userColumnWidths = userColumnWidths;
    this.userRowHeights = userRowHeights;
    this.calculatedRowHeights = calculatedRowHeights;
    this.calculatedColumnWidths = calculatedColumnWidths;
    this.fontWidths = fontWidths;

    // Need to track the last moved rows/columns array so we know if we need to reset our models cache
    this.modelRows = modelRows;
    this.modelColumns = modelColumns;
    this.movedRows = movedRows;
    this.movedColumns = movedColumns;
  }

  /**
   * Get the metrics for the provided metric state
   * @params state The state to get metrics for
   * @returns The full metrics
   */
  getMetrics(state: GridMetricState): GridMetrics {
    const {
      left,
      top,
      leftOffset,
      topOffset,
      width,
      height,
      theme,
      model,
      movedRows,
      movedColumns,
    } = state;
    const {
      rowHeight,
      rowHeaderWidth,
      rowFooterWidth,
      columnWidth,
      columnHeaderHeight,
      minScrollHandleSize,
      scrollBarSize,
    } = theme;

    if (movedRows !== this.movedRows) {
      this.movedRows = movedRows;
      this.modelRows.clear();
    }

    if (movedColumns !== this.movedColumns) {
      this.movedColumns = movedColumns;
      this.modelColumns.clear();
    }

    const {
      columnCount,
      rowCount,
      floatingTopRowCount,
      floatingBottomRowCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
      columnHeaderMaxDepth,
    } = model;

    // Get some basic metrics
    const firstRow = this.getFirstRow(state);
    const firstColumn = this.getFirstColumn(state);

    const gridX = this.getGridX(state);
    const gridY = this.getGridY(state);

    const treePaddingX =
      isExpandableGridModel(model) && model.hasExpandableRows
        ? this.calculateTreePaddingX(state)
        : 0;
    const treePaddingY = 0; // We don't support trees on columns (at least not yet)

    let visibleRowHeights = this.getVisibleRowHeights(state);
    let visibleColumnWidths = this.getVisibleColumnWidths(
      state,
      firstColumn,
      treePaddingX
    );

    // Calculate the metrics for the main grid
    const visibleRows = Array.from(visibleRowHeights.keys());
    const visibleColumns = Array.from(visibleColumnWidths.keys());

    // Add the floating row heights/column widths
    // TODO #316: Create an allRowHeights/allColumnWidths maps
    visibleRowHeights = new Map([
      ...visibleRowHeights,
      ...this.getFloatingRowHeights(state),
    ]);
    visibleColumnWidths = new Map([
      ...visibleColumnWidths,
      ...this.getFloatingColumnWidths(state),
    ]);

    let visibleColumnXs = this.getVisibleColumnXs(
      visibleColumnWidths,
      visibleColumns,
      leftOffset
    );
    let visibleRowYs = this.getVisibleRowYs(
      visibleRowHeights,
      visibleRows,
      topOffset
    );

    const bottom =
      visibleRows.length > 0 ? visibleRows[visibleRows.length - 1] : top;
    const right =
      visibleColumns.length > 0
        ? visibleColumns[visibleColumns.length - 1]
        : left;

    const bottomViewport = this.getBottomViewport(
      state,
      visibleRows,
      visibleRowYs,
      visibleRowHeights
    );
    const rightViewport = this.getRightViewport(
      state,
      visibleColumns,
      visibleColumnXs,
      visibleColumnWidths
    );

    const columnWidthValues = Array.from(visibleColumnWidths.values());
    const rowHeightValues = Array.from(visibleRowHeights.values());
    const maxX = columnWidthValues.reduce((x, w) => x + w, 0) - leftOffset;
    const maxY = rowHeightValues.reduce((y, h) => y + h, 0) - topOffset;

    const floatingBottomHeight = this.getFloatingBottomHeight(
      state,
      visibleRowHeights
    );

    const lastLeft = this.getLastLeft(
      state,
      null,
      width - gridX - scrollBarSize - rowFooterWidth
    );
    const lastTop = this.getLastTop(
      state,
      null,
      height - gridY - scrollBarSize - floatingBottomHeight
    );

    // How much total space the content will take
    const scrollableContentWidth = leftOffset + maxX + rowFooterWidth;
    const scrollableContentHeight = topOffset + maxY;

    // Visible space available in the canvas viewport
    const scrollableViewportWidth = width - gridX;
    const scrollableViewportHeight = height - gridY;

    // Calculate some metrics for the scroll bars
    const hasHorizontalBar =
      lastLeft > 0 || scrollableContentWidth > scrollableViewportWidth;
    const horizontalBarHeight = hasHorizontalBar ? scrollBarSize : 0;
    const hasVerticalBar =
      lastTop > 0 ||
      scrollableContentHeight > scrollableViewportHeight - horizontalBarHeight;
    const verticalBarWidth = hasVerticalBar ? scrollBarSize : 0;
    const barWidth = width - rowHeaderWidth - verticalBarWidth;
    const barHeight = height - columnHeaderHeight - horizontalBarHeight;
    const barLeft = rowHeaderWidth;
    const barTop = columnHeaderHeight;

    // How big the scroll handle is relative to the bar
    const horizontalHandlePercent =
      columnCount === 1
        ? barWidth / scrollableContentWidth
        : (columnCount - lastLeft) / columnCount;

    const verticalHandlePercent =
      rowCount === 1
        ? barHeight / scrollableContentHeight
        : (rowCount - lastTop) / rowCount;

    const handleWidth = hasHorizontalBar
      ? clamp(
          barWidth * horizontalHandlePercent,
          minScrollHandleSize,
          barWidth - 1
        )
      : 0;
    const handleHeight = hasVerticalBar
      ? clamp(
          barHeight * verticalHandlePercent,
          minScrollHandleSize,
          barHeight - 1
        )
      : 0;

    const leftColumnWidth = getOrThrow(visibleColumnWidths, left, 0);
    const topRowHeight = getOrThrow(visibleRowHeights, top, 0);
    const leftOffsetPercent =
      leftColumnWidth > 0 ? leftOffset / leftColumnWidth : 0;
    const topOffsetPercent = topRowHeight > 0 ? topOffset / topRowHeight : 0;

    // How much of the available space has been scrolled
    const horizontalScrollPercent =
      columnCount === 1
        ? leftOffset / (scrollableContentWidth - scrollableViewportWidth)
        : (left + leftOffsetPercent) / lastLeft;
    const verticalScrollPercent =
      rowCount === 1
        ? topOffset / (scrollableContentHeight - scrollableViewportHeight)
        : (top + topOffsetPercent) / lastTop;

    const scrollX = hasHorizontalBar
      ? horizontalScrollPercent * (barWidth - handleWidth)
      : 0;
    const scrollY = hasVerticalBar
      ? verticalScrollPercent * (barHeight - handleHeight)
      : 0;

    // Now add the floating sections positions
    let floatingRows: ModelIndex[] = [];
    if (floatingTopRowCount > 0 || floatingBottomRowCount > 0) {
      floatingRows = [
        ...Array(floatingTopRowCount).keys(),
        ...[...Array(floatingBottomRowCount).keys()].map(i => rowCount - i - 1),
      ];
      visibleRowYs = new Map([
        ...visibleRowYs,
        ...this.getFloatingRowYs(
          state,
          visibleRowHeights,
          Math.floor(height - gridY - horizontalBarHeight)
        ),
      ]);
    }

    let floatingColumns: ModelIndex[] = [];
    if (floatingLeftColumnCount > 0 || floatingRightColumnCount > 0) {
      floatingColumns = [
        ...Array(floatingLeftColumnCount).keys(),
        ...[...Array(floatingRightColumnCount).keys()].map(
          i => columnCount - i - 1
        ),
      ];
      visibleColumnXs = new Map([
        ...visibleColumnXs,
        ...this.getFloatingColumnXs(
          state,
          visibleColumnWidths,
          Math.floor(width - gridX - verticalBarWidth)
        ),
      ]);
    }

    const allRows = visibleRows.concat(floatingRows);
    const allColumns = visibleColumns.concat(floatingColumns);
    const modelRows = this.getModelRows(allRows, state);
    const modelColumns = this.getModelColumns(allColumns, state);

    const visibleRowTreeBoxes = this.getVisibleRowTreeBoxes(
      visibleRowHeights,
      modelRows,
      state
    );

    // Calculate the visible viewport based on scroll position and floating sections
    const topVisible = this.getTopVisible(
      state,
      visibleRowYs,
      visibleRowHeights,
      visibleRows
    );
    const leftVisible = this.getLeftVisible(
      state,
      visibleColumnXs,
      visibleColumnWidths,
      visibleColumns
    );
    const bottomVisible =
      lastTop > 0
        ? this.getBottomVisible(
            state,
            visibleRowYs,
            visibleRowHeights,
            visibleRows,
            gridY
          )
        : bottom;
    const rightVisible =
      lastLeft > 0
        ? this.getRightVisible(
            state,
            visibleColumnXs,
            visibleColumnWidths,
            visibleColumns,
            gridX
          )
        : right;

    const floatingTopHeight = this.getFloatingTopHeight(
      state,
      visibleRowHeights
    );
    const floatingLeftWidth = this.getFloatingLeftWidth(
      state,
      visibleColumnWidths
    );
    const floatingRightWidth = this.getFloatingRightWidth(
      state,
      visibleColumnWidths
    );

    const {
      fontWidths,
      userColumnWidths,
      userRowHeights,
      calculatedRowHeights,
      calculatedColumnWidths,
    } = this;

    return {
      // Row/Column metrics from model
      rowHeight,
      rowHeaderWidth,
      rowFooterWidth,
      rowCount,
      columnWidth,
      columnCount,
      columnHeaderHeight,

      // Floating row and column counts
      floatingTopRowCount,
      floatingBottomRowCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,

      // The grid offset from the top left
      gridX,
      gridY,

      // Index of non-hidden row/columns
      firstRow,
      firstColumn,

      // The amount of padding for tree (if applicable)
      treePaddingX,
      treePaddingY,

      // What viewport is currently visible, limited by data size
      left,
      top,
      bottom,
      right,
      topOffset,
      leftOffset,

      // Bottom and right that are fully visible, not overlapped by scroll bars or anything
      topVisible,
      leftVisible,
      bottomVisible,
      rightVisible,

      // Bottom and right of the viewport, not limited by data size
      bottomViewport,
      rightViewport,

      // Canvas width/height
      width,
      height,

      // Max x/y coordinate of the grid (does not include headers)
      maxX,
      maxY,

      // Last valid column/row that can be the left/top of the grid
      lastLeft,
      lastTop,

      // Scroll bar metrics
      barHeight,
      barTop,
      barWidth,
      barLeft,
      handleHeight,
      handleWidth,
      hasHorizontalBar,
      hasVerticalBar,
      verticalBarWidth,
      horizontalBarHeight,

      // The vertical x/y scroll amount
      scrollX,
      scrollY,

      scrollableContentWidth,
      scrollableContentHeight,

      scrollableViewportWidth,
      scrollableViewportHeight,

      // Array of visible rows/columns, by grid index
      visibleRows,
      visibleColumns,

      // Array of floating rows/columns, by grid index
      floatingRows,
      floatingColumns,

      // Array of all rows/columns, visible and floating, by grid index
      allRows,
      allColumns,

      // Map of the height/width of visible rows/columns
      // TODO #316: This should be split into allRowHeights/visibleRowHeights/floatingRowHeights ideally
      visibleRowHeights,
      visibleColumnWidths,

      // Floating metrics
      floatingTopHeight,
      floatingBottomHeight,
      floatingLeftWidth,
      floatingRightWidth,

      // Map of the X/Y coordinates of the rows/columns, from the top left of the grid
      visibleRowYs,
      visibleColumnXs,

      // The boxes user can click on for expanding/collapsing tree rows
      visibleRowTreeBoxes,

      // Mapping from visible row indexes to the model row/columns they pull from
      modelRows,
      modelColumns,

      movedRows,
      movedColumns,

      // Map of the width of the fonts
      fontWidths,

      // Map of user set column/row width/height
      userColumnWidths,
      userRowHeights,

      // Map of calculated row/column height/width
      calculatedRowHeights,
      calculatedColumnWidths,

      columnHeaderMaxDepth,
    };
  }

  /**
   * The x offset of the grid
   * @param state The current grid state
   * @returns x value of the left side of the first cell
   */
  getGridX(state: GridMetricState): Coordinate {
    const { theme } = state;
    const { rowHeaderWidth } = theme;

    return rowHeaderWidth;
  }

  /**
   * The y offset of the grid
   * @param state The current grid state
   * @returns y value of the top side of the first cell
   */
  getGridY(state: GridMetricState): Coordinate {
    const { theme, model } = state;
    const { columnHeaderHeight } = theme;
    const { columnHeaderMaxDepth } = model;

    return columnHeaderMaxDepth * columnHeaderHeight;
  }

  /**
   * The height of the "visible" area (excludes floating areas)
   * @param state The current grid state
   * @param visibleRowHeights All the visible row heights
   * @returns The visible height in pixels
   */
  getVisibleHeight(
    state: GridMetricState,
    visibleRowHeights: SizeMap = this.getFloatingRowHeights(state)
  ): number {
    const { height, theme } = state;
    const { scrollBarSize } = theme;
    const gridY = this.getGridY(state);
    const floatingBottomHeight = this.getFloatingBottomHeight(
      state,
      visibleRowHeights
    );
    const floatingTopHeight = this.getFloatingTopHeight(
      state,
      visibleRowHeights
    );

    return (
      height - floatingBottomHeight - floatingTopHeight - gridY - scrollBarSize
    );
  }

  /**
   * The width of the "visible" area (excludes floating areas)
   * @param state The current grid state
   * @param visibleColumnWidths All the visible column widths
   * @returns The visible width in pixels
   */
  getVisibleWidth(
    state: GridMetricState,
    visibleColumnWidths: SizeMap = this.getFloatingColumnWidths(state)
  ): number {
    const { width, theme } = state;
    const { scrollBarSize, rowFooterWidth } = theme;
    const gridX = this.getGridX(state);
    const floatingRightWidth = this.getFloatingRightWidth(
      state,
      visibleColumnWidths
    );
    const floatingLeftWidth = this.getFloatingLeftWidth(
      state,
      visibleColumnWidths
    );

    return (
      width -
      floatingLeftWidth -
      floatingRightWidth -
      gridX -
      scrollBarSize -
      rowFooterWidth
    );
  }

  /**
   * Retrieve the index of the first non-hidden item
   * @param itemSizes The size of the items in this dimension
   * @param getModelIndex A function to map from the Index to the ModelIndex
   * @param state The current grid state
   * @returns The first item that is not hidden
   */
  getFirstIndex(
    itemSizes: ModelSizeMap,
    getModelIndex: (
      visibleIndex: VisibleIndex,
      state: GridMetricState
    ) => ModelIndex,
    state: GridMetricState
  ): VisibleIndex {
    // We only need to check at the very most the number of items the user has hidden + 1
    const max = itemSizes.size + 1;
    for (let i = 0; i < max; i += 1) {
      const modelIndex = getModelIndex(i, state);
      if (itemSizes.get(modelIndex) !== 0) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Get the first column index that isn't hidden
   * @param state The current grid state
   * @returns The first column that is not hidden
   */
  getFirstColumn(state: GridMetricState): VisibleIndex {
    return this.getFirstIndex(
      this.userColumnWidths,
      this.getModelColumn.bind(this),
      state
    );
  }

  /**
   * Get the first row index that isn't hidden
   * @param state The current grid state
   * @returns The first row that is not hidden
   */
  getFirstRow(state: GridMetricState): VisibleIndex {
    return this.getFirstIndex(
      this.userRowHeights,
      this.getModelRow.bind(this),
      state
    );
  }

  /**
   * Get the last column that can be the left most column (e.g. scrolled to the right)
   * If no right column is provided, then the last column is used.
   * @param state The current grid state
   * @param right The right-most column to be visible, or null to default to last cell
   * @param visibleWidth The width of the "visible" area (excluding floating items)
   * @returns The index of the last left visible column
   */
  getLastLeft(
    state: GridMetricState,
    right: VisibleIndex | null = null,
    visibleWidth: number = this.getVisibleWidth(state)
  ): VisibleIndex {
    const { model } = state;
    const { columnCount } = model;

    let lastLeft = columnCount - 1;
    if (right != null) {
      lastLeft = right;
    }
    let x = 0;
    while (lastLeft >= 0) {
      const columnWidth = this.getVisibleColumnWidth(lastLeft, state);
      x += columnWidth;

      if (x >= visibleWidth) {
        return Math.min(lastLeft + 1, columnCount - 1);
      }

      lastLeft -= 1;
    }

    return 0;
  }

  /**
   * The last row that can be the top row (e.g. scrolled to the bottom)
   * If no bottom row is provided, then the last row that is not floating is used
   */

  /**
   * The last row that can be the top row (e.g. scrolled to the bottom)
   * If no bottom row is provided, then the last row that is not floating is used
   * @param state The current grid state
   * @param bottom The bottom-most row to be visible, or null to default to last cell
   * @param visibleHeight The height of the "visible" area (excluding floating items)
   * @returns The index of the last left visible column
   */
  getLastTop(
    state: GridMetricState,
    bottom: VisibleIndex | null = null,
    visibleHeight: number = this.getVisibleHeight(state)
  ): VisibleIndex {
    const { model } = state;
    const { rowCount, floatingBottomRowCount } = model;

    let lastTop = Math.max(0, rowCount - floatingBottomRowCount - 1);
    if (bottom != null) {
      lastTop = bottom;
    }
    let y = 0;
    while (lastTop > 0) {
      const rowHeight = this.getVisibleRowHeight(lastTop, state);
      y += rowHeight;

      if (y >= visibleHeight) {
        return Math.min(lastTop + 1, rowCount - 1);
      }

      lastTop -= 1;
    }

    return 0;
  }

  /**
   * Retrieve the top row to scroll to so the passed in `topVisible` is completely visible, taking the floating rows into account.
   * The `top` row is at the top underneath any floating rows, whereas `topVisible` is visible below the floating rows.
   * If there are no floating rows, they should be the same value.
   * @param state The grid metric state
   * @param topVisible The top row to be visible
   * @returns The index of the top row to scroll to (under the floating top rows)
   */
  getTopForTopVisible(
    state: GridMetricState,
    topVisible: VisibleIndex
  ): VisibleIndex {
    const floatingTopHeight = this.getFloatingTopHeight(state);
    let top = topVisible;
    let y = 0;
    while (top > 0 && y < floatingTopHeight) {
      top -= 1;
      y += this.getVisibleRowHeight(top, state);
    }
    return top;
  }

  /**
   * Retrieve the top row to scroll to so the passed in `bottomVisible` is completely visible
   * at the bottom of the visible viewport, taking the floating rows into account.
   * @param state The grid metric state
   * @param bottomVisible The bottom row to be visible
   * @returns The index of the top row to scroll to (under the floating top rows)
   */
  getTopForBottomVisible(
    state: GridMetricState,
    bottomVisible: VisibleIndex
  ): VisibleIndex {
    const { height } = state;
    const gridY = this.getGridY(state);
    const floatingBottomHeight = this.getFloatingBottomHeight(state);
    const availableHeight = height - gridY - floatingBottomHeight;
    return this.getLastTop(state, bottomVisible, availableHeight);
  }

  /**
   * Retrieve the left column to scroll to so the passed in `leftVisible` is completely visible
   * at the left of the visible viewport, taking the floating columns into account.
   * @param state The grid metric state
   * @param leftVisible The left column to be visible
   * @returns The index of the left column to scroll to (under the floating left columns)
   */
  getLeftForLeftVisible(
    state: GridMetricState,
    leftVisible: VisibleIndex
  ): VisibleIndex {
    const floatingLeftWidth = this.getFloatingLeftWidth(state);
    let left = leftVisible;
    let x = 0;
    while (left > 0 && x < floatingLeftWidth) {
      left -= 1;
      x += this.getVisibleColumnWidth(left, state);
    }
    return left;
  }

  /**
   * Retrieve the left column to scroll to so the passed in `rightVisible` is completely visible
   * at the right of the visible viewport, taking the floating columns into account.
   * @param state The grid metric state
   * @param rightVisible The right column to be visible
   * @returns The index of the left column to scroll to (under the floating left columns)
   */
  getLeftForRightVisible(
    state: GridMetricState,
    rightVisible: VisibleIndex
  ): VisibleIndex {
    const { width } = state;
    const gridX = this.getGridX(state);
    const floatingRightWidth = this.getFloatingRightWidth(state);
    const availableWidth = width - gridX - floatingRightWidth;
    return this.getLastLeft(state, rightVisible, availableWidth);
  }

  /**
   * Retrieve a map of the height of each floating row
   * @param state The grid metric state
   * @returns The heights of all the floating rows
   */
  getFloatingRowHeights(state: GridMetricState): SizeMap {
    const { model } = state;
    const { floatingTopRowCount, floatingBottomRowCount, rowCount } = model;

    const rowHeights = new Map();
    for (let i = 0; i < floatingTopRowCount && i < rowCount; i += 1) {
      rowHeights.set(i, this.getVisibleRowHeight(i, state));
    }

    for (
      let i = 0;
      i < floatingBottomRowCount && rowCount - i - 1 >= 0;
      i += 1
    ) {
      const row = rowCount - i - 1;
      rowHeights.set(row, this.getVisibleRowHeight(row, state));
    }

    return rowHeights;
  }

  /**
   * Retrieve a map of the height of all the visible rows (non-floating)
   * @param state The grid metric state
   * @returns The heights of all the visible rows
   */
  getVisibleRowHeights(state: GridMetricState): SizeMap {
    const { top, topOffset, height, model } = state;

    let y = 0;
    let row = top;
    const rowHeights = new Map();
    const { rowCount } = model;
    while (y < height + topOffset && row < rowCount) {
      const rowHeight = this.getVisibleRowHeight(row, state);
      rowHeights.set(row, rowHeight);
      y += rowHeight;
      row += 1;
    }

    return rowHeights;
  }

  /**
   * Retrieve a map of the width of each floating column
   * @param state The grid metric state
   * @param firstColumn The first non-hidden column
   * @param treePaddingX The amount of padding taken up for the tree expansion buttons
   * @returns The widths of all the floating columns
   */
  getFloatingColumnWidths(
    state: GridMetricState,
    firstColumn: VisibleIndex = this.getFirstColumn(state),
    treePaddingX: number = this.calculateTreePaddingX(state)
  ): SizeMap {
    const { model } = state;
    const {
      columnCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
    } = model;

    const columnWidths = new Map();
    for (let i = 0; i < floatingLeftColumnCount && i < columnCount; i += 1) {
      columnWidths.set(
        i,
        this.getVisibleColumnWidth(i, state, firstColumn, treePaddingX)
      );
    }

    for (
      let i = 0;
      i < floatingRightColumnCount && columnCount - i - 1 >= 0;
      i += 1
    ) {
      const column = columnCount - i - 1;
      columnWidths.set(
        column,
        this.getVisibleColumnWidth(column, state, firstColumn, treePaddingX)
      );
    }

    return columnWidths;
  }

  /**
   * Retrieve a map of the width of all the visible columns (non-floating)
   * @param state The grid metric state
   * @returns The widths of all the visible columns
   */
  getVisibleColumnWidths(
    state: GridMetricState,
    firstColumn: VisibleIndex = this.getFirstColumn(state),
    treePaddingX: number = this.calculateTreePaddingX(state)
  ): SizeMap {
    const { left, leftOffset, width, model } = state;

    let x = 0;
    let column = left;
    const columnWidths = new Map();
    const { columnCount } = model;
    while (x < width + leftOffset && column < columnCount) {
      const columnWidth = this.getVisibleColumnWidth(
        column,
        state,
        firstColumn,
        treePaddingX
      );
      columnWidths.set(column, columnWidth);
      x += columnWidth;
      column += 1;
    }

    return columnWidths;
  }

  /**
   * Retrieve a map of all the floating columns to their x coordinate
   * @param state The grid metric state
   * @param columnWidthMap Map from visible index to column width
   * @param maxX The maximum X size for the grid
   * @returns Map of the x coordinate of all floating columns
   */
  getFloatingColumnXs(
    state: GridMetricState,
    columnWidthMap: SizeMap,
    maxX: Coordinate
  ): CoordinateMap {
    const { model } = state;
    const {
      columnCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
    } = model;

    return getFloatingCoordinates(
      floatingLeftColumnCount,
      floatingRightColumnCount,
      columnCount,
      maxX,
      columnWidthMap
    );
  }

  /**
   * Retrieve a map of all the visible columns to their x coordinate.
   * Starts at leftOffset with the first index in `visibleColumns`, then
   * calculates all the coordinates from there
   * @param visibleColumnWidths Map of visible column index to widths
   * @param visibleColumns All visible columns
   * @param leftOffset The left scroll offset
   * @returns Map of the x coordinate of all visible columns
   */
  getVisibleColumnXs(
    visibleColumnWidths: SizeMap,
    visibleColumns: VisibleIndex[],
    leftOffset: number
  ): CoordinateMap {
    const visibleColumnXs = new Map();
    let x = -leftOffset;
    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = getOrThrow(visibleColumnWidths, column);
      visibleColumnXs.set(column, x);
      x += columnWidth;
    }

    return visibleColumnXs;
  }

  /**
   * Retrieve a map of all the floating rows to their y coordinate
   * @param state The grid metric state
   * @param rowHeightMap Map of visible index to row height
   * @param maxY The maximum Y size for the grid
   * @returns Map of the y coordinate of all floating rows
   */
  getFloatingRowYs(
    state: GridMetricState,
    rowHeightMap: SizeMap,
    maxY: Coordinate
  ): CoordinateMap {
    const { model } = state;
    const { floatingTopRowCount, floatingBottomRowCount, rowCount } = model;

    return getFloatingCoordinates(
      floatingTopRowCount,
      floatingBottomRowCount,
      rowCount,
      maxY,
      rowHeightMap
    );
  }

  /**
   * Retrieve a map of all the visible rows to their y coordinate.
   * Starts at topOffset with the first index in `visibleRows`, then
   * calculates all the coordinates from there
   * @param visibleRowHeights Map of visible row index to heights
   * @param visibleRows All visible rows
   * @param topOffset The top scroll offset
   * @returns Map of the y coordinate of all visible rows
   */
  getVisibleRowYs(
    visibleRowHeights: SizeMap,
    visibleRows: VisibleIndex[],
    topOffset: number
  ): CoordinateMap {
    const visibleRowYs = new Map();
    let y = -topOffset;
    for (let i = 0; i < visibleRows.length; i += 1) {
      const row = visibleRows[i];
      const rowHeight = getOrThrow(visibleRowHeights, row);
      visibleRowYs.set(row, y);
      y += rowHeight;
    }

    return visibleRowYs;
  }

  /**
   * Calculates the tree box click areas that are visible. In relation to the columnX/rowY
   * @param visibleRowHeights Map of visible index to row height
   * @param modelRows Map from visible `Index` to `ModelIndex`
   * @param state The grid metric state
   * @returns Coordinates of tree boxes for each row
   */
  getVisibleRowTreeBoxes(
    visibleRowHeights: SizeMap,
    modelRows: VisibleToModelMap,
    state: GridMetricState
  ): Map<VisibleIndex, BoxCoordinates> {
    const visibleRowTreeBoxes = new Map();
    const { model, theme } = state;
    const { treeDepthIndent, treeHorizontalPadding } = theme;

    if (isExpandableGridModel(model) && model.hasExpandableRows) {
      visibleRowHeights.forEach((rowHeight, row) => {
        const modelRow = getOrThrow(modelRows, row);
        if (model.isRowExpandable(modelRow)) {
          const depth = model.depthForRow(modelRow);
          const x1 = depth * treeDepthIndent + treeHorizontalPadding;
          const x2 = (depth + 1) * treeDepthIndent + treeHorizontalPadding;
          const y1 = 0;
          const y2 = rowHeight;
          visibleRowTreeBoxes.set(row, { x1, y1, x2, y2 });
        }
      });
    }

    return visibleRowTreeBoxes;
  }

  /**
   * Get the total width of the floating columns on the left
   * @param state The grid metric state
   * @param columnWidths Map of column index to width
   * @returns The total width of the floating left section
   */
  getFloatingLeftWidth(
    state: GridMetricState,
    columnWidths: SizeMap = this.getFloatingColumnWidths(state)
  ): number {
    const { model } = state;
    const { floatingLeftColumnCount } = model;
    let floatingWidth = 0;
    for (let i = 0; i < floatingLeftColumnCount; i += 1) {
      floatingWidth += getOrThrow(columnWidths, i);
    }
    return floatingWidth;
  }

  /**
   * Get the total width of the floating columns on the right
   * @param state The grid metric state
   * @param columnWidths Map of column index to width
   * @returns The total width of the floating right section
   */
  getFloatingRightWidth(
    state: GridMetricState,
    columnWidths: SizeMap = this.getFloatingColumnWidths(state)
  ): number {
    const { model } = state;
    const { floatingRightColumnCount, columnCount } = model;
    let floatingWidth = 0;
    for (let i = 0; i < floatingRightColumnCount; i += 1) {
      floatingWidth += getOrThrow(columnWidths, columnCount - i - 1);
    }

    return floatingWidth;
  }

  /**
   * Get the total height of the floating rows on the top
   * @param state The grid metric state
   * @param rowHeights Map of row index to height
   * @returns The total height of the floating top section
   */
  getFloatingTopHeight(
    state: GridMetricState,
    rowHeights: SizeMap = this.getFloatingRowHeights(state)
  ): number {
    const { model } = state;
    const { floatingTopRowCount } = model;
    let floatingHeight = 0;
    for (let i = 0; i < floatingTopRowCount; i += 1) {
      floatingHeight += getOrThrow(rowHeights, i);
    }
    return floatingHeight;
  }

  /**
   * Get the total height of the floating rows on the bottom
   * @param state The grid metric state
   * @param rowHeights Map of row index to height
   * @returns The total height of the floating bottom section
   */
  getFloatingBottomHeight(
    state: GridMetricState,
    rowHeights: SizeMap = this.getFloatingRowHeights(state)
  ): number {
    const { model } = state;
    const { floatingBottomRowCount, rowCount } = model;
    let floatingHeight = 0;
    for (let i = 0; i < floatingBottomRowCount; i += 1) {
      floatingHeight += getOrThrow(rowHeights, rowCount - i - 1);
    }
    return floatingHeight;
  }

  /**
   * Retrieve the index of the first fully visible row in the "visible" viewport of the grid.
   * E.g. First row visible after the floating rows, provided the visible rows.
   * @param state The grid metric state
   * @param visibleRowYs Map of row index to y coordinate
   * @param visibleRowHeights Map of row index to height
   * @param visibleRows Array of visible row indexes
   * @returns Index of the top visible row
   */
  getTopVisible(
    state: GridMetricState,
    visibleRowYs: CoordinateMap,
    visibleRowHeights: SizeMap,
    visibleRows: VisibleIndex[]
  ): VisibleIndex {
    const floatingHeight = this.getFloatingTopHeight(state, visibleRowHeights);
    for (let i = 0; i < visibleRows.length; i += 1) {
      const row = visibleRows[i];
      const y = getOrThrow(visibleRowYs, row);
      if (y >= floatingHeight) {
        return row;
      }
    }
    return 0;
  }

  /**
   * Retrieve the index of the first fully visible column in the "visible" viewport of the grid.
   * E.g. First column visible after the floating columns, provided the visible columns.
   * @param state The grid metric state
   * @param visibleColumnXs Map of column index to x coordinate
   * @param visibleColumnWidths Map of column index to widths
   * @param visibleColumns Array of visible row indexes
   * @returns Index of the left visible column
   */
  getLeftVisible(
    state: GridMetricState,
    visibleColumnXs: CoordinateMap,
    visibleColumnWidths: SizeMap,
    visibleColumns: VisibleIndex[]
  ): VisibleIndex {
    const floatingWidth = this.getFloatingLeftWidth(state, visibleColumnWidths);
    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const x = getOrThrow(visibleColumnXs, column);
      if (x >= floatingWidth) {
        return column;
      }
    }
    return 0;
  }

  /**
   * Retrieve the index of the last fully visible row in the "visible" viewport of the grid.
   * E.g. Last row visible before the bottom floating rows, provided the visible rows.
   * @param state The grid metric state
   * @param visibleRowYs Map of row index to y coordinate
   * @param visibleRowHeights Map of row index to height
   * @param visibleRows Array of visible row indexes
   * @param gridY The starting y coordinate of the grid
   * @returns Index of the bottom visible row
   */
  getBottomVisible(
    state: GridMetricState,
    visibleRowYs: CoordinateMap,
    visibleRowHeights: SizeMap,
    visibleRows: VisibleIndex[],
    gridY: Coordinate
  ): VisibleIndex {
    const { height, theme } = state;
    const { scrollBarSize } = theme;
    const floatingHeight = this.getFloatingBottomHeight(
      state,
      visibleRowHeights
    );
    const visibleHeight = height - gridY - scrollBarSize - floatingHeight;
    for (let i = visibleRows.length - 1; i >= 0; i -= 1) {
      const row = visibleRows[i];
      const rowY = getOrThrow(visibleRowYs, row);
      const rowHeight = getOrThrow(visibleRowHeights, row);
      if (rowY + rowHeight <= visibleHeight) {
        return row;
      }
    }

    return 0;
  }

  /**
   * Retrieve the index of the last fully visible column in the "visible" viewport of the grid.
   * E.g. Last column visible before the floating columns, provided the visible columns.
   * @param state The grid metric state
   * @param visibleColumnXs Map of column index to x coordinate
   * @param visibleColumnWidths Map of column index to widths
   * @param visibleColumns Array of visible column indexes
   * @returns Index of the right visible column
   */
  getRightVisible(
    state: GridMetricState,
    visibleColumnXs: CoordinateMap,
    visibleColumnWidths: SizeMap,
    visibleColumns: VisibleIndex[],
    gridX: Coordinate
  ): VisibleIndex {
    const { width, theme } = state;
    const { scrollBarSize } = theme;
    const floatingWidth = this.getFloatingRightWidth(
      state,
      visibleColumnWidths
    );
    const visibleWidth = width - gridX - scrollBarSize - floatingWidth;
    for (let i = visibleColumns.length - 1; i >= 0; i -= 1) {
      const column = visibleColumns[i];
      const columnX = getOrThrow(visibleColumnXs, column);
      const columnWidth = getOrThrow(visibleColumnWidths, column);
      if (columnX + columnWidth <= visibleWidth) {
        return column;
      }
    }

    return 0;
  }

  /**
   * Retrieve the possible bottom of the visible viewport (not limited by data size)
   * @param state The grid metric state
   * @param visibleRows Array of visible row indexes
   * @param visibleRowYs Map of row index to y coordinate
   * @param visibleRowHeights Map of row index to height
   * @returns The index of the bottom viewport possible
   */
  getBottomViewport(
    state: GridMetricState,
    visibleRows: VisibleIndex[],
    visibleRowYs: CoordinateMap,
    visibleRowHeights: SizeMap
  ): VisibleIndex {
    const { height, theme } = state;
    const { rowHeight } = theme;

    return this.getLastIndexViewport(
      visibleRows,
      visibleRowYs,
      visibleRowHeights,
      height,
      rowHeight
    );
  }

  /**
   * Retrieve the possible right of the visible viewport (not limited by data size)
   * @param state The grid metric state
   * @param visibleColumns Array of visible column indexes
   * @param visibleColumnXs Map of column index to x coordinate
   * @param visibleColumnWidths Map of column index to width
   * @returns The index of the right viewport possible
   */
  getRightViewport(
    state: GridMetricState,
    visibleColumns: VisibleIndex[],
    visibleColumnXs: CoordinateMap,
    visibleColumnWidths: SizeMap
  ): VisibleIndex {
    const { width, theme } = state;
    const { columnWidth } = theme;

    return this.getLastIndexViewport(
      visibleColumns,
      visibleColumnXs,
      visibleColumnWidths,
      width,
      columnWidth
    );
  }

  /**
   * Get the Index of the of the last index visible
   * @param items Array of visible item indexes
   * @param itemXs Map of index to coordinate
   * @param itemSizes Map of index to size
   * @param maxSize Full size of the grid
   * @param defaultItemSize Default size of an item
   * @returns The Index of the last index visible
   */
  getLastIndexViewport(
    items: VisibleIndex[],
    itemXs: CoordinateMap,
    itemSizes: SizeMap,
    maxSize: number,
    defaultItemSize: number
  ): VisibleIndex {
    let lastIndex = 0;
    let dataSize = 0;
    if (items.length > 0) {
      lastIndex = items[items.length - 1];
      dataSize =
        getOrThrow(itemXs, lastIndex) + getOrThrow(itemSizes, lastIndex);
    }

    if (dataSize < maxSize) {
      lastIndex += Math.ceil((maxSize - dataSize) / defaultItemSize);
    }

    return lastIndex;
  }

  /**
   * Get the size from the provided size map of the specified item
   * @param modelIndex The model index to get the size for
   * @param userSizes The user set sizes
   * @param calculateSize Method to calculate the size for this item
   * @returns The size from the provided size map of the specified item
   */
  getVisibleItemSize(
    modelIndex: ModelIndex,
    userSizes: ModelSizeMap,
    calculateSize: () => number
  ): number {
    // Always re-calculate the size of the item so the calculated size maps are populated
    const calculatedSize = calculateSize();
    return userSizes.get(modelIndex) ?? calculatedSize;
  }

  /**
   * Get the height of the specified row
   * @param row Index of the row to get the height of
   * @param state The grid metric state
   * @returns The height of the row specified
   */
  getVisibleRowHeight(row: VisibleIndex, state: GridMetricState): number {
    const modelRow = this.getModelRow(row, state);

    return this.getVisibleItemSize(modelRow, this.userRowHeights, () =>
      this.calculateRowHeight(row, modelRow, state)
    );
  }

  /**
   * Get the width of the specified column
   * @param column Index of the column to get the width of
   * @param state The grid metric state
   * @param firstColumn Index of first visible column
   * @param treePaddingX The amount of tree padding to add to the first visible column
   * @returns The width of the column
   */
  getVisibleColumnWidth(
    column: VisibleIndex,
    state: GridMetricState,
    firstColumn: VisibleIndex = this.getFirstColumn(state),
    treePaddingX: number = this.calculateTreePaddingX(state)
  ): number {
    const modelColumn = this.getModelColumn(column, state);

    return this.getVisibleItemSize(modelColumn, this.userColumnWidths, () =>
      this.calculateColumnWidth(
        column,
        modelColumn,
        state,
        firstColumn,
        treePaddingX
      )
    );
  }

  /**
   * Get a map of VisibleIndex to ModelIndex
   * @param visibleRows Array of visible row indexes
   * @param state The grid metric state
   * @returns Map of VisibleIndex to ModelIndex
   */
  getModelRows(
    visibleRows: VisibleIndex[],
    state: GridMetricState
  ): VisibleToModelMap {
    const modelRows = new Map();
    for (let i = 0; i < visibleRows.length; i += 1) {
      const visibleRow = visibleRows[i];
      const modelRow = this.getModelRow(visibleRow, state);
      modelRows.set(visibleRow, modelRow);
    }
    return modelRows;
  }

  /**
   * Get the ModelIndex of the specified row
   * @param visibleRow Index of the row
   * @param state The grid metric state
   * @returns ModelIndex of the row
   */
  getModelRow(visibleRow: VisibleIndex, state: GridMetricState): ModelIndex {
    if (this.modelRows.has(visibleRow)) {
      return getOrThrow(this.modelRows, visibleRow);
    }
    const { movedRows } = state;
    const modelRow = GridUtils.getModelIndex(visibleRow, movedRows);
    this.modelRows.set(visibleRow, modelRow);
    return modelRow;
  }

  /**
   * Get a map of Index to ModelIndex. Applies the move operations to get the transformation.
   * @param visibleColumns Array of visible column indexes
   * @param state The grid metric state
   * @returns Map of Index to ModelIndex
   */
  getModelColumns(
    visibleColumns: VisibleIndex[],
    state: GridMetricState
  ): VisibleToModelMap {
    const modelColumns = new Map();
    for (let i = 0; i < visibleColumns.length; i += 1) {
      const visibleColumn = visibleColumns[i];
      const modelColumn = this.getModelColumn(visibleColumn, state);
      modelColumns.set(visibleColumn, modelColumn);
    }
    return modelColumns;
  }

  /**
   * Get the ModelIndex of the specified column
   * @param visibleColumn Index of the column
   * @param state The grid metric state
   * @returns ModelIndex of the column
   */
  getModelColumn(
    visibleColumn: VisibleIndex,
    state: GridMetricState
  ): ModelIndex {
    if (this.modelColumns.has(visibleColumn)) {
      return getOrThrow(this.modelColumns, visibleColumn);
    }
    const { movedColumns } = state;
    const modelColumn = GridUtils.getModelIndex(visibleColumn, movedColumns);
    this.modelColumns.set(visibleColumn, modelColumn);
    return modelColumn;
  }

  /**
   * Calculate the height of the row specified.
   * @param row Index of the row to calculate the height for
   * @param modelRow ModelIndex of the row to calculate the height
   * @param state The grid metric state
   * @returns The height of the row
   */
  calculateRowHeight(
    row: VisibleIndex,
    modelRow: ModelIndex,
    state: GridMetricState
  ): number {
    const { theme } = state;
    const { autoSizeRows, rowHeight } = theme;
    if (!autoSizeRows) {
      return rowHeight;
    }

    const cachedValue = this.calculatedRowHeights.get(modelRow);
    if (cachedValue != null) {
      return cachedValue;
    }

    // Not sure how to accurately get the height of text. For now just return the theme height.
    this.calculatedRowHeights.set(modelRow, Math.ceil(rowHeight));
    trimMap(this.calculatedRowHeights);
    return rowHeight;
  }

  /**
   * Calculates the column width based on the provided column model index
   * @param column Index of the column to calculate the width for
   * @param modelColumn ModelIndex of the column to calculate the width
   * @param state The grid metric state
   * @param firstColumn The first visible column
   * @param treePaddingX Tree padding offset for expandable rows
   * @returns The width of the column
   */
  calculateColumnWidth(
    column: VisibleIndex,
    modelColumn: ModelIndex,
    state: GridMetricState,
    firstColumn: VisibleIndex = this.getFirstColumn(state),
    treePaddingX: number = this.calculateTreePaddingX(state)
  ): number {
    const { theme } = state;
    const { autoSizeColumns, minColumnWidth } = theme;
    if (!autoSizeColumns) {
      const { columnWidth } = theme;
      return columnWidth;
    }

    const headerWidth = this.calculateColumnHeaderWidth(modelColumn, state);
    const dataWidth = this.calculateColumnDataWidth(modelColumn, state);
    const cachedValue = this.calculatedColumnWidths.get(modelColumn);
    let columnWidth = Math.ceil(Math.max(headerWidth, dataWidth));
    columnWidth = Math.max(minColumnWidth, columnWidth);
    if (cachedValue != null && cachedValue > columnWidth) {
      columnWidth = cachedValue;
    } else {
      this.calculatedColumnWidths.set(modelColumn, columnWidth);
      trimMap(this.calculatedColumnWidths);
    }

    if (column === firstColumn) {
      columnWidth += treePaddingX;
    }

    return columnWidth;
  }

  /**
   * Calculate the width of the specified column's header
   * @param modelColumn ModelIndex of the column to get the header width for
   * @param state The grid metric state
   * @returns The calculated width of the column header
   */
  calculateColumnHeaderWidth(
    modelColumn: ModelIndex,
    state: GridMetricState
  ): number {
    const { model, theme } = state;
    const { headerFont, headerHorizontalPadding } = theme;

    const headerText = model.textForColumnHeader(modelColumn, 0);
    if (headerText) {
      const headerFontWidth = this.getWidthForFont(headerFont, state);
      return headerText.length * headerFontWidth + headerHorizontalPadding * 2;
    }

    return headerHorizontalPadding * 2;
  }

  /**
   * Calculate the width of the specified column's data
   * @param modelColumn ModelIndex of the column to get the data width for
   * @param state The grid metric state
   * @returns The calculated width of the column data
   */
  calculateColumnDataWidth(
    modelColumn: ModelIndex,
    state: GridMetricState
  ): number {
    const { top, height, width, model, theme } = state;
    const { floatingTopRowCount, floatingBottomRowCount, rowCount } = model;
    const {
      font,
      cellHorizontalPadding,
      rowHeight,
      rowHeaderWidth,
      rowFooterWidth,
      scrollBarSize,
    } = theme;

    let columnWidth = 0;

    const fontWidth = this.getWidthForFont(font, state);
    const rowsPerPage = height / rowHeight;
    const bottom = Math.ceil(top + rowsPerPage);
    GridUtils.iterateAllItems(
      top,
      bottom,
      floatingTopRowCount,
      floatingBottomRowCount,
      rowCount,
      row => {
        const modelRow = this.getModelRow(row, state);
        const text = model.textForCell(modelColumn, modelRow);
        if (text) {
          const cellPadding = cellHorizontalPadding * 2;
          columnWidth = Math.max(
            columnWidth,
            text.length * fontWidth + cellPadding
          );
        }
      }
    );

    columnWidth = Math.max(
      Math.min(
        columnWidth,
        (width - rowHeaderWidth - scrollBarSize - rowFooterWidth) *
          GridMetricCalculator.MAX_COLUMN_WIDTH
      ),
      cellHorizontalPadding * 2
    );

    return columnWidth;
  }

  /**
   * The coordinate for where the tree padding should be drawn
   * @param state The grid metric state
   * @returns The coordinate for tree padding
   */
  calculateTreePaddingX(state: GridMetricState): Coordinate {
    const { top, height, model, theme } = state;
    const { rowHeight, treeDepthIndent } = theme;
    if (!isExpandableGridModel(model) || !model.hasExpandableRows) {
      return 0;
    }
    let treePadding = 0;

    const rowsPerPage = height / rowHeight;
    const bottom = Math.ceil(top + rowsPerPage);
    for (let row = top; row <= bottom; row += 1) {
      const modelRow = this.getModelRow(row, state);
      const depth = model.depthForRow(modelRow);
      treePadding = Math.max(treePadding, treeDepthIndent * (depth + 1));
    }

    return treePadding;
  }

  /**
   * Get the width of the provided font. Exploits the fact that we're
   * using tabular figures so every character is same width
   * @param font The font to get the width for
   * @param state The grid metric state
   * @returns Width of the char `8` for the specified font
   */
  getWidthForFont(font: GridFont, state: GridMetricState): number {
    if (this.fontWidths.has(font)) {
      return getOrThrow(this.fontWidths, font);
    }
    const { context } = state;
    context.font = font;
    const textMetrics = context.measureText('8');
    const { width } = textMetrics;

    // context.font changes the string a little bit, e.g. '10px Arial, sans serif' => '10px Arial, "sans serif"'
    // Rather than require checking with the correct font def (theme, or context font), just key it to both
    this.fontWidths.set(font, width);
    this.fontWidths.set(context.font, width);

    return width;
  }

  /**
   * Sets the width for the specified column
   * @param column The column model index to set
   * @param size The size to set it to
   */
  setColumnWidth(column: ModelIndex, size: number): void {
    // Always use a new instance of the map so any consumer of the metrics knows there has been a change
    const userColumnWidths = new Map(this.userColumnWidths);
    userColumnWidths.set(column, Math.ceil(size));
    trimMap(userColumnWidths);
    this.userColumnWidths = userColumnWidths;
  }

  /**
   * Resets the column width for the specified column to the calculated width
   * @param column The column model index to reset
   */
  resetColumnWidth(column: ModelIndex): void {
    // Always use a new instance of the map so any consumer of the metrics knows there has been a change
    const userColumnWidths = new Map(this.userColumnWidths);
    userColumnWidths.delete(column);
    this.userColumnWidths = userColumnWidths;
  }

  /**
   * Sets the width for the specified row
   * @param row The row model index to set
   * @param size The size to set it to
   */
  setRowHeight(row: ModelIndex, size: number): void {
    // Always use a new instance of the map so any consumer of the metrics knows there has been a change
    const userRowHeights = new Map(this.userRowHeights);
    userRowHeights.set(row, Math.ceil(size));
    trimMap(userRowHeights);
    this.userRowHeights = userRowHeights;
  }

  /**
   * Resets the row height for the specified row to the calculated height
   * @param row The row model index to reset
   */
  resetRowHeight(row: ModelIndex): void {
    // Always use a new instance of the map so any consumer of the metrics knows there has been a change
    const userRowHeights = new Map(this.userRowHeights);
    userRowHeights.delete(row);
    this.userRowHeights = userRowHeights;
    this.calculatedRowHeights.delete(row);
  }
}

export default GridMetricCalculator;
