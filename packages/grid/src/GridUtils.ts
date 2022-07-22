import React from 'react';
import GridRange, { GridRangeIndex } from './GridRange';
import {
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
import type { GridMetrics } from './GridMetrics';
import { GridTheme } from './GridTheme';
import { GridWheelEvent } from './GridMouseHandler';
import {
  AxisRange,
  BoundedAxisRange,
  isBoundedAxisRange,
  Range,
} from './GridAxisRange';

export type GridPoint = {
  x: Coordinate;
  y: Coordinate;
  column: GridRangeIndex;
  row: GridRangeIndex;
  columnHeaderDepth?: number;
};

export interface CellInfo {
  row: VisibleIndex | null;
  column: VisibleIndex | null;
  modelRow: ModelIndex | null;
  modelColumn: ModelIndex | null;
  left: Coordinate | null;
  top: Coordinate | null;
  columnWidth: number | null;
  rowHeight: number | null;
}

export type IndexCallback<T> = (itemIndex: VisibleIndex) => T | undefined;

export class GridUtils {
  // use same constant as chrome source for windows
  // https://github.com/chromium/chromium/blob/973af9d461b6b5dc60208c8d3d66adc27e53da78/ui/events/blink/web_input_event_builders_win.cc#L285
  static PIXELS_PER_LINE = 100 / 3;

  /**
   * Get the GridPoint for the coordinates provided
   * @param x The grid x coordinate
   * @param y The grid y coordinate
   * @param metrics The grid metrics
   * @returns The GridPoint including the column/row information
   */
  static getGridPointFromXY(
    x: Coordinate,
    y: Coordinate,
    metrics: GridMetrics
  ): GridPoint {
    const column = GridUtils.getColumnAtX(x, metrics);
    const row = GridUtils.getRowAtY(y, metrics);
    const columnHeaderDepth = GridUtils.getColumnHeaderDepthAtY(y, metrics);

    return { x, y, row, column, columnHeaderDepth };
  }

  static getCellInfoFromXY(
    x: Coordinate,
    y: Coordinate,
    metrics: GridMetrics
  ): CellInfo {
    const { row, column } = GridUtils.getGridPointFromXY(x, y, metrics);

    const {
      visibleColumnWidths,
      visibleRowHeights,
      visibleColumnXs,
      visibleRowYs,
      modelColumns,
      modelRows,
    } = metrics;

    const modelRow = row !== null ? modelRows.get(row) : null;
    const modelColumn = column !== null ? modelColumns.get(column) : null;
    const left = column !== null ? visibleColumnXs.get(column) : null;
    const top = row !== null ? visibleRowYs.get(row) : null;
    const columnWidth =
      column !== null ? visibleColumnWidths.get(column) : null;
    const rowHeight = row !== null ? visibleRowHeights.get(row) : null;

    return {
      row,
      column,
      modelRow: modelRow ?? null,
      modelColumn: modelColumn ?? null,
      left: left ?? null,
      top: top ?? null,
      columnWidth: columnWidth ?? null,
      rowHeight: rowHeight ?? null,
    };
  }

  static getColumnHeaderDepthAtY(
    y: Coordinate,
    metrics: GridMetrics
  ): number | undefined {
    const row = GridUtils.getRowAtY(y, metrics);
    const { columnHeaderHeight, columnHeaderMaxDepth } = metrics;

    if (row === null && y <= columnHeaderHeight * columnHeaderMaxDepth) {
      return columnHeaderMaxDepth - Math.ceil(y / columnHeaderHeight);
    }

    return undefined;
  }

  /**
   * Iterate through each floating item at the start and call a callback, returning the first result
   * @param start The count of floating items at the start
   * @param total The total number of items
   * @param callback Function to call for each item
   * @returns The result from the callback
   */
  static iterateFloatingStart<T>(
    start: number,
    total: number,
    callback: IndexCallback<T>
  ): T | undefined {
    for (let i = 0; i < start && i < total; i += 1) {
      const result = callback(i);
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  }

  /**
   * Iterate through floating items at the end. Iterates in increasing order.
   * @param end The count of floating items at the end
   * @param total The total number of items
   * @param callback Function to call for each item
   * @returns The result from the callback
   */
  static iterateFloatingEnd<T>(
    end: number,
    total: number,
    callback: IndexCallback<T>
  ): T | undefined {
    for (let i = 0; i < end && total - (end - i) >= 0; i += 1) {
      const result = callback(total - (end - i));
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  }

  /**
   * Iterate through all floating items in increasing order, starting with the top items.
   * @param start Count of start floating rows, e.g. floatingTopRowCount
   * @param end Count of end floating rows, e.g. floatingBottomRowCount
   * @param total Total number of items
   * @param callback Callback called for each value, stopping the iterating and returning the value if one is returned
   */
  static iterateFloating<T>(
    start: number,
    end: number,
    total: number,
    callback: IndexCallback<T>
  ): T | undefined {
    const result = GridUtils.iterateFloatingStart(start, total, callback);
    if (result !== undefined) {
      return result;
    }
    return GridUtils.iterateFloatingEnd(end, total, callback);
  }

  /**
   * Iterate through all items in one dimension on the grid - first floating, then visible.
   * Call the callback for each item, break if a result is returned and return that result.
   * @param visibleStart Index of the start of the visible viewport
   * @param visibleEnd Index of the end of the visible viewport
   * @param floatingStartCount Number of items floating at the start
   * @param floatingEndCount Number of items floating at the end
   * @param totalCount Total number of items
   * @param callback Callback to call for each item
   * @returns The first result from the callback called, or undefined
   */
  static iterateAllItems<T>(
    visibleStart: VisibleIndex,
    visibleEnd: VisibleIndex,
    floatingStartCount: number,
    floatingEndCount: number,
    totalCount: number,
    callback: IndexCallback<T>
  ): T | undefined {
    const visibleStartIndex = Math.max(visibleStart, floatingStartCount);
    const visibleEndIndex = Math.min(
      visibleEnd,
      totalCount - floatingEndCount - 1
    );
    let result = GridUtils.iterateFloating(
      floatingStartCount,
      floatingEndCount,
      totalCount,
      callback
    );
    if (result !== undefined) {
      return result;
    }

    for (let i = visibleStartIndex; i <= visibleEndIndex; i += 1) {
      result = callback(i);
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  }

  /**
   * Check if the coordinate is within the item specified in this dimension
   * @param itemIndex Index of the item to check
   * @param itemCoordinatess Coordinate of all items in this dimension
   * @param itemSizes Size of all items in this dimension
   * @param coordinate The coordinate to check
   * @returns True if the coordinate is within the item specified, false otherwise
   */
  static isInItem(
    itemIndex: VisibleIndex,
    itemCoordinates: CoordinateMap,
    itemSizes: SizeMap,
    coordinate: Coordinate
  ): boolean {
    const itemX = itemCoordinates.get(itemIndex) ?? 0;
    const itemSize = itemSizes.get(itemIndex) ?? 0;
    return itemX <= coordinate && coordinate <= itemX + itemSize;
  }

  /**
   * Get the Index of the item at the provided offset
   * @param offset Coordinate of the offset to get the item of
   * @param itemCount The total count of items
   * @param floatingStart Count of floating items at the start
   * @param floatingEnd Count of floating items at the end
   * @param items Index of all items
   * @param itemCoordinates The coordinate of each item
   * @param itemSizes The size of each item
   * @returns The item index, or null if no item matches
   */
  static getItemAtOffset(
    offset: Coordinate,
    itemCount: number,
    floatingStart: number,
    floatingEnd: number,
    items: VisibleIndex[],
    itemCoordinates: CoordinateMap,
    itemSizes: SizeMap,
    ignoreFloating = false
  ): VisibleIndex | null {
    const floatingItem = ignoreFloating
      ? undefined
      : GridUtils.iterateFloating(
          floatingStart,
          floatingEnd,
          itemCount,
          item => {
            if (GridUtils.isInItem(item, itemCoordinates, itemSizes, offset)) {
              return item;
            }
            return undefined;
          }
        );
    if (!ignoreFloating && floatingItem !== undefined) {
      return floatingItem;
    }

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (GridUtils.isInItem(item, itemCoordinates, itemSizes, offset)) {
        return item;
      }
    }

    return null;
  }

  /**
   * Get the index of the column at the specified x coordinate
   * @param x Coordinate to get the item of
   * @param metrics Grid metrics
   * @returns Index of the column at that coordinate, or null if no column matches
   */
  static getColumnAtX(
    x: Coordinate,
    metrics: GridMetrics,
    ignoreFloating = false
  ): VisibleIndex | null {
    const {
      columnCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
      visibleColumns,
      visibleColumnXs,
      visibleColumnWidths,
      gridX,
    } = metrics;

    if (x < gridX) {
      return null;
    }

    return this.getItemAtOffset(
      x - gridX,
      columnCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
      visibleColumns,
      visibleColumnXs,
      visibleColumnWidths,
      ignoreFloating
    );
  }

  /**
   * Get the index of the row at the specified y coordinate
   * @param y Coordinate to get the item of
   * @param metrics Grid metrics
   * @returns Index of the row at that coordinate, or null if no row matches
   */
  static getRowAtY(y: Coordinate, metrics: GridMetrics): VisibleIndex | null {
    const {
      floatingTopRowCount,
      floatingBottomRowCount,
      rowCount,
      visibleRows,
      visibleRowYs,
      visibleRowHeights,
      gridY,
    } = metrics;

    if (y < gridY) {
      return null;
    }

    return this.getItemAtOffset(
      y - gridY,
      rowCount,
      floatingTopRowCount,
      floatingBottomRowCount,
      visibleRows,
      visibleRowYs,
      visibleRowHeights
    );
  }

  /**
   * Iterate backward through the visible items until a shown item is hit
   * @param startIndex The index to start from
   * @param modelIndexes The mapping of model indexes
   * @param visibleItems The visible items
   * @param userSizes The user set sizes
   * @returns Index of the next visible item, or null if no more are visible
   */
  static getNextShownItem(
    startIndex: VisibleIndex,
    modelIndexes: VisibleToModelMap,
    visibleItems: VisibleIndex[],
    userSizes: ModelSizeMap
  ): VisibleIndex | null {
    let visibleItemIndex =
      visibleItems.findIndex(value => value === startIndex) || 0;
    visibleItemIndex -= 1;
    while (visibleItemIndex != null && visibleItemIndex >= 0) {
      const item = visibleItems[visibleItemIndex];
      const modelIndex = modelIndexes.get(item);
      if (modelIndex != null && userSizes.get(modelIndex) !== 0) {
        return item;
      }

      visibleItemIndex -= 1;
    }

    return null;
  }

  /**
   * Iterate backward through the visible columns until a shown column is hit
   * @param columnIndex The column index to start iterating backward from
   * @param metrics The GridMetricCalculator metrics
   * @returns Index of the next visible item, or null if no more are visible
   */
  static getNextShownColumn(
    startIndex: VisibleIndex,
    metrics: GridMetrics
  ): VisibleIndex | null {
    const { modelColumns, visibleColumns, userColumnWidths } = metrics;
    return GridUtils.getNextShownItem(
      startIndex,
      modelColumns,
      visibleColumns,
      userColumnWidths
    );
  }

  /**
   * Iterate backward through the visible rows until a shown row is hit
   * @param rowIndex The row index to start iterating backward from
   * @param metrics The GridMetricCalculator metrics
   * @returns Index of the next visible item, or null if no more are visible
   */
  static getNextShownRow(
    startIndex: VisibleIndex,
    metrics: GridMetrics
  ): VisibleIndex | null {
    const { modelRows, visibleRows, userRowHeights } = metrics;
    return GridUtils.getNextShownItem(
      startIndex,
      modelRows,
      visibleRows,
      userRowHeights
    );
  }

  /**
   * Gets the column index if the x/y coordinates provided are close enough to the separator, otherwise null
   * @param x Mouse x coordinate
   * @param y Mouse y coordinate
   * @param metrics The grid metrics
   * @param theme The grid theme with potential user overrides
   * @returns Index of the column separator at the coordinates provided, or null if none match
   */
  static getColumnSeparatorIndex(
    x: Coordinate,
    y: Coordinate,
    metrics: GridMetrics,
    theme: GridTheme
  ): VisibleIndex | null {
    const {
      rowHeaderWidth,
      columnHeaderHeight,
      floatingColumns,
      floatingLeftWidth,
      visibleColumns,
      visibleColumnXs,
      visibleColumnWidths,
      columnHeaderMaxDepth,
    } = metrics;
    const { allowColumnResize, headerSeparatorHandleSize } = theme;

    if (
      columnHeaderMaxDepth * columnHeaderHeight < y ||
      !allowColumnResize ||
      headerSeparatorHandleSize <= 0
    ) {
      return null;
    }

    const gridX = x - rowHeaderWidth;
    const halfSeparatorSize = headerSeparatorHandleSize * 0.5;

    // Iterate through the floating columns first since they're on top
    let isPreviousColumnHidden = false;
    for (let i = floatingColumns.length - 1; i >= 0; i -= 1) {
      const column = floatingColumns[i];
      const columnX = visibleColumnXs.get(column) ?? 0;
      const columnWidth = visibleColumnWidths.get(column) ?? 0;
      const isColumnHidden = columnWidth === 0;
      if (!isPreviousColumnHidden || !isColumnHidden) {
        let midX = columnX + columnWidth;
        if (isColumnHidden) {
          midX += halfSeparatorSize;
        } else if (isPreviousColumnHidden) {
          midX -= halfSeparatorSize;
        }

        const minX = midX - halfSeparatorSize;
        const maxX = midX + halfSeparatorSize;
        if (minX <= gridX && gridX <= maxX) {
          return column;
        }

        isPreviousColumnHidden = isColumnHidden;
      }
    }

    // Iterate backward so that you can reveal hidden columns properly
    isPreviousColumnHidden = false;
    for (let i = visibleColumns.length - 1; i >= 0; i -= 1) {
      const column = visibleColumns[i];
      const columnX = visibleColumnXs.get(column) ?? 0;
      const columnWidth = visibleColumnWidths.get(column) ?? 0;
      const isColumnHidden = columnWidth === 0;

      // If this column is under the floating columns "layer". Terminate early.
      if (columnX < floatingLeftWidth - columnWidth) {
        return null;
      }

      if (!isPreviousColumnHidden || !isColumnHidden) {
        let midX = columnX + columnWidth;
        if (isColumnHidden) {
          midX += halfSeparatorSize;
        } else if (isPreviousColumnHidden) {
          midX -= halfSeparatorSize;
        }

        const minX = midX - halfSeparatorSize;
        const maxX = midX + halfSeparatorSize;
        if (minX <= gridX && gridX <= maxX) {
          return column;
        }

        isPreviousColumnHidden = isColumnHidden;
      }
    }

    return null;
  }

  /**
   * Check if the item specified is hidden
   * @param itemIndex Index of the item to check
   * @param visibleSizes Sizes of all visible items
   * @returns True if the item is hidden, false otherwise
   */
  static isItemHidden(itemIndex: VisibleIndex, visibleSizes: SizeMap): boolean {
    return visibleSizes.get(itemIndex) === 0;
  }

  /**
   * Check if the column specified is hidden
   * @param columnIndex Index of the column to check
   * @param metrics Grid metrics
   * @returns True if the column is hidden, false otherwise
   */
  static isColumnHidden(
    columnIndex: VisibleIndex,
    metrics: GridMetrics
  ): boolean {
    const { visibleColumnWidths } = metrics;
    return GridUtils.isItemHidden(columnIndex, visibleColumnWidths);
  }

  /**
   * Check if the provided row is a floating row
   * @param row The row index to check
   * @param metrics The grid metrics to check against
   * @returns True if it's a floating row, false otherwise
   */
  static isFloatingRow(row: VisibleIndex, metrics: GridMetrics): boolean {
    if (row == null) {
      return false;
    }

    const { floatingTopRowCount, floatingBottomRowCount, rowCount } = metrics;
    return (
      row < floatingTopRowCount || row >= rowCount - floatingBottomRowCount
    );
  }

  /**
   * Check if the provided column is a floating column
   * @param column The column index to check
   * @param metrics The grid metrics to check against
   * @returns True if it's a floating column, false otherwise
   */
  static isFloatingColumn(column: VisibleIndex, metrics: GridMetrics): boolean {
    if (column == null) {
      return false;
    }

    const {
      floatingLeftColumnCount,
      floatingRightColumnCount,
      columnCount,
    } = metrics;
    return (
      column < floatingLeftColumnCount ||
      column >= columnCount - floatingRightColumnCount
    );
  }

  /**
   * Get all the items that are hidden under the same Index
   * E.g. If columns are 1, 2, 3, 4, 5, and column 2, 3, 4 are hidden, and we check for item 4, the return will be [2, 3, 4]
   * @param itemIndex Index of the item to start at
   * @param visibleSizes Visible size map
   * @param visibleItems Visible items
   * @returns Array of items that are hidden
   */
  static getHiddenItems(
    itemIndex: VisibleIndex,
    visibleSizes: SizeMap,
    visibleItems: VisibleIndex[]
  ): VisibleIndex[] {
    if (!GridUtils.isItemHidden(itemIndex, visibleSizes)) {
      return [];
    }

    const hiddenItems = [itemIndex];
    const visibleItemIndex = visibleItems.findIndex(
      value => value === itemIndex
    );
    for (let i = visibleItemIndex - 1; i >= 0; i -= 1) {
      const item = visibleItems[i];
      if (!GridUtils.isItemHidden(item, visibleSizes)) {
        break;
      }

      hiddenItems.push(item);
    }

    return hiddenItems;
  }

  /**
   * Get all the columns that are hidden under the same Index
   * @param columnIndex Index of the item to start at
   * @param metrics Grid metrics
   * @returns Array of items that are hidden
   */
  static getHiddenColumns(
    columnIndex: VisibleIndex,
    metrics: GridMetrics
  ): VisibleIndex[] {
    const { visibleColumns, visibleColumnWidths } = metrics;
    return GridUtils.getHiddenItems(
      columnIndex,
      visibleColumnWidths,
      visibleColumns
    );
  }

  /**
   * Returns the row index if the x/y coordinates provided are close enough to the separator, otherwise null
   * @param x X coordinate to check
   * @param y Y coordinate to check
   * @param metrics The grid metrics
   * @param theme The grid theme
   * @returns Index of the row separator at the coordinates provided, or null if none match
   */
  static getRowSeparatorIndex(
    x: Coordinate,
    y: Coordinate,
    metrics: GridMetrics,
    theme: GridTheme
  ): VisibleIndex | null {
    const {
      rowHeaderWidth,
      columnHeaderHeight,
      visibleRows,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;
    const { allowRowResize, headerSeparatorHandleSize } = theme;

    if (
      rowHeaderWidth < x ||
      !allowRowResize ||
      headerSeparatorHandleSize <= 0
    ) {
      return null;
    }

    const gridY = y - columnHeaderHeight;
    const halfSeparatorSize = headerSeparatorHandleSize * 0.5;

    // Iterate backward so you can reveal hidden rows properly
    let isPreviousRowHidden = false;
    for (let i = visibleRows.length - 1; i >= 0; i -= 1) {
      const row = visibleRows[i];
      const rowY = visibleRowYs.get(row) ?? 0;
      const rowHeight = visibleRowHeights.get(row) ?? 0;
      const isRowHidden = rowHeight === 0;
      if (!isPreviousRowHidden || !isRowHidden) {
        let midY = rowY + rowHeight;
        if (isRowHidden) {
          midY += halfSeparatorSize;
        } else if (isPreviousRowHidden) {
          midY -= halfSeparatorSize;
        }

        const minY = midY - halfSeparatorSize;
        const maxY = midY + halfSeparatorSize;

        if (minY <= gridY && gridY <= maxY) {
          return row;
        }

        isPreviousRowHidden = isRowHidden;
      }
    }

    return null;
  }

  /**
   * Check if the row specified is hidden
   * @param rowIndex Index of the row to check
   * @param metrics Grid metrics
   * @returns True if the row is hidden, false otherwise
   */
  static isRowHidden(rowIndex: VisibleIndex, metrics: GridMetrics): boolean {
    const { visibleRowHeights } = metrics;
    return GridUtils.isItemHidden(rowIndex, visibleRowHeights);
  }

  /**
   * Get all the rows that are hidden under the same Index
   * @param rowIndex Index of the item to start at
   * @param metrics Grid metrics
   * @returns Array of items that are hidden
   */
  static getHiddenRows(
    rowIndex: VisibleIndex,
    metrics: GridMetrics
  ): VisibleIndex[] {
    const { visibleRows, visibleRowHeights } = metrics;
    return GridUtils.getHiddenItems(rowIndex, visibleRowHeights, visibleRows);
  }

  /**
   * Set a new order for items in the grid
   * @param from The visible index to move from
   * @param to The visible index to move the item to
   * @param oldMovedItems The old reordered items
   * @returns The new reordered items
   */
  static moveItem(
    from: VisibleIndex,
    to: VisibleIndex,
    oldMovedItems: MoveOperation[]
  ): MoveOperation[] {
    if (from === to) {
      return oldMovedItems;
    }

    const movedItems: MoveOperation[] = [...oldMovedItems];
    const lastMovedItem = movedItems[movedItems.length - 1];

    // Check if we should combine with the previous move
    // E.g. 1 -> 2, 2 -> 3 can just be 1 -> 3
    if (
      lastMovedItem &&
      !isBoundedAxisRange(lastMovedItem.from) &&
      lastMovedItem.to === from
    ) {
      // Remove the move if it is now a no-op
      if (lastMovedItem.from === to) {
        movedItems.pop();
      } else {
        movedItems[movedItems.length - 1] = {
          ...lastMovedItem,
          to,
        };
      }
    } else {
      movedItems.push({ from, to });
    }

    return movedItems;
  }

  /**
   * Move a visible range in the grid
   *
   * This will effectively slice the range out of the grid,
   * re-index the remaining columns,
   * then insert the range with the first element at the provided index
   *
   * @param from The visible axis range to move
   * @param to The visible index to move the start of the range to
   * @param oldMovedItems The old reordered items
   * @returns The new reordered items
   */
  static moveRange(
    from: BoundedAxisRange,
    to: VisibleIndex,
    oldMovedItems: MoveOperation[]
  ): MoveOperation[] {
    if (from[0] === to) {
      return oldMovedItems;
    }

    const movedItems: MoveOperation[] = [...oldMovedItems];
    const lastMovedItem = movedItems[movedItems.length - 1];

    // Check if we should combine with the previous move
    // E.g. [1, 2] -> 2, [2, 3] -> 3 can just be [1, 2] -> 3
    if (
      lastMovedItem &&
      isBoundedAxisRange(lastMovedItem.from) &&
      lastMovedItem.from[1] - lastMovedItem.from[0] === from[1] - from[0] &&
      lastMovedItem.to === from[0]
    ) {
      // Remove the move if it is now a no-op
      if (lastMovedItem.from[0] === to) {
        movedItems.pop();
      } else {
        movedItems[movedItems.length - 1] = {
          ...lastMovedItem,
          to,
        };
      }
    } else {
      movedItems.push({ from, to });
    }

    // Remove the move if it is now a no-op
    if (
      movedItems[movedItems.length - 1].from ===
      movedItems[movedItems.length - 1].to
    ) {
      movedItems.pop();
    }

    return movedItems;
  }

  /**
   * Applies the items moves to the AxisRange
   * @param start The start index of the range
   * @param end The end index of the range
   * @param movedItems The move operations to apply
   * @param reverse If the moved items should be applied in reverse (this reverses the effects of the moves)
   * @returns A list of AxisRanges in the translated space. Possibly multiple non-continuous ranges
   */
  static applyItemMoves<T extends number | GridRangeIndex>(
    start: T,
    end: T,
    movedItems: MoveOperation[],
    reverse = false
  ): Range<T>[] {
    let result: Range<T>[] = [[start, end]];

    for (
      let i = reverse ? movedItems.length - 1 : 0;
      reverse ? i >= 0 : i < movedItems.length;
      reverse ? (i -= 1) : (i += 1)
    ) {
      const { from: fromItemOrRange, to: toItem } = movedItems[i];
      let length = 1;
      let fromItem: number;
      if (isBoundedAxisRange(fromItemOrRange)) {
        length = fromItemOrRange[1] - fromItemOrRange[0] + 1; // Ranges are inclusive
        [fromItem] = fromItemOrRange;
      } else {
        fromItem = fromItemOrRange;
      }

      const fromStart = reverse ? toItem : fromItem;
      const fromEnd = fromStart + length - 1;
      const toStart = reverse ? fromItem : toItem;
      const moveDistance = toStart - fromStart;

      const nextResult: Range<number>[] = [];
      for (let j = 0; j < result.length; j += 1) {
        const currentStart = result[j][0] ?? Number.NEGATIVE_INFINITY;
        const currentEnd = result[j][1] ?? Number.POSITIVE_INFINITY;

        let movedRange: Range<number> | undefined;
        const currentResult: Range<number>[] = [
          [currentStart, fromStart - 1],
          [fromStart, fromEnd],
          [fromEnd + 1, currentEnd],
        ]
          .map(
            ([s, e]): Range<number> => [
              // Cap the ranges to within the current range bounds
              Math.max(s, currentStart),
              Math.min(e, currentEnd),
            ]
          )
          .filter(([s, e]) => s <= e) // Remove invalid ranges
          .map(
            (range): Range<number> => {
              const [s, e] = range;
              if (fromStart <= s && fromEnd >= e) {
                // Current range in moved range
                movedRange = [s + moveDistance, e + moveDistance];
                return movedRange;
              }

              if (fromEnd < s) {
                // Current range is after moved range
                return [s - length, e - length];
              }
              return range;
            }
          )
          .map((range): Range<number>[] => {
            const [s, e] = range;
            if (toStart > s && toStart <= e) {
              // Moved range splits this range
              return [
                [s, toStart - 1],
                [toStart + length, e + length],
              ];
            }

            if (range === movedRange) {
              // Moved range has already been shifted
              return [range];
            }

            if (toStart <= s) {
              // Moved range shifts this range right
              return [[s + length, e + length]];
            }
            return [range];
          })
          .flat();

        nextResult.push(...currentResult);
      }

      // Return infinity values back to null
      result = nextResult.map(([s, e]) => [
        Number.isFinite(s) ? s : null,
        Number.isFinite(e) ? e : null,
      ]) as Range<T>[];
    }
    return result;
  }

  /**
   * Applies the items moves to the givengrid range
   * @param range The grid range to translate
   * @param movedColumns The moved columns
   * @param movedRows The moved rows
   * @param reverse If the moved items should be reversed (i.e. visible to model range)
   * @returns A list of grid ranges in the translated space. Possibly multiple non-continuous ranges
   */
  static translateRange(
    range: GridRange,
    movedColumns: MoveOperation[],
    movedRows: MoveOperation[],
    reverse: boolean
  ): GridRange[] {
    const columnRanges = GridUtils.applyItemMoves(
      range.startColumn,
      range.endColumn,
      movedColumns,
      reverse
    );
    const rowRanges = GridUtils.applyItemMoves(
      range.startRow,
      range.endRow,
      movedRows,
      reverse
    );
    const ranges: GridRange[] = [];
    for (let i = 0; i < columnRanges.length; i += 1) {
      const c = columnRanges[i];
      for (let j = 0; j < rowRanges.length; j += 1) {
        const r = rowRanges[j];
        ranges.push(new GridRange(c[0], r[0], c[1], r[1]));
      }
    }
    return ranges;
  }

  /**
   * Retrieve the model index given the currently moved items
   * @param visibleIndex The visible index of the item to get the model index for
   * @param movedItems The moved items
   * @returns The model index of the item
   */
  static getModelIndex(
    visibleIndex: VisibleIndex,
    movedItems: MoveOperation[]
  ): ModelIndex {
    const modelIndex = GridUtils.applyItemMoves(
      visibleIndex,
      visibleIndex,
      movedItems,
      true
    )[0][0];

    return modelIndex;
  }

  /**
   * Retrieve the model indexes given the currently moved items
   * @param visibleIndexes The visible indexes of the item to get the model indexes for
   * @param movedItems The moved items
   * @returns The model indexes of the item
   */
  static getModelIndexes(
    visibleIndexes: ModelIndex[],
    movedItems: MoveOperation[]
  ): VisibleIndex[] {
    return visibleIndexes.map(i => GridUtils.getModelIndex(i, movedItems));
  }

  /**
   * Translate the provided UI start/end indexes to the model start/end indexes by applying the `movedItems` transformations.
   * Since moved items can split apart a range, multiple pairs of indexes are returned
   *
   * @param start Start item in one dimension
   * @param end End item in one dimension
   * @param movedItems Moved item pairs in this dimension
   * @returns Array of start/end pairs of the indexes after transformations applied.
   */
  static getModelRangeIndexes(
    start: GridRangeIndex,
    end: GridRangeIndex,
    movedItems: MoveOperation[]
  ): AxisRange[] {
    return GridUtils.applyItemMoves(start, end, movedItems, true);
  }

  /**
   * Translate the provided UI range into model range, using the `movedColumns` and `movedRows` to apply the necessary transforms.
   * `movedColumns` and `movedRows` are array of operations done to the UI indexes to re-order items
   *
   * @param uiRange The currently selected UI ranges
   * @param movedColumns The moved column pairs
   * @param movedRows The moved row pairs
   * @returns The model ranges after translation.
   */
  static getModelRange(
    uiRange: GridRange,
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = []
  ): GridRange[] {
    return GridUtils.translateRange(uiRange, movedColumns, movedRows, true);
  }

  /**
   * Translate the provided UI range into model ranges, using the `movedColumns` and `movedRows` to apply the necessary transforms.
   * `movedColumns` and `movedRows` are array of operations done to the UI indexes to re-order items
   *
   * @param uiRanges The currently selected UI ranges
   * @param movedColumns The moved column pairs
   * @param movedRows The moved row pairs
   * @returns The model ranges after translation.
   */
  static getModelRanges(
    uiRanges: GridRange[],
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = []
  ): GridRange[] {
    const modelRanges = [];
    for (let i = 0; i < uiRanges.length; i += 1) {
      modelRanges.push(
        ...GridUtils.getModelRange(uiRanges[i], movedColumns, movedRows)
      );
    }
    return modelRanges;
  }

  /**
   * Translate the provided UI start/end indexes to the model start/end indexes by applying the `movedItems` transformations.
   * Since moved items can split apart a range, multiple pairs of indexes are returned
   *
   * @param start Start item in one dimension
   * @param end End item in one dimension
   * @param movedItems Moved item pairs in this dimension
   * @returns Array of start/end pairs of the indexes after transformations applied.
   */
  static getVisibleRangeIndexes(
    start: GridRangeIndex,
    end: GridRangeIndex,
    movedItems: MoveOperation[]
  ): AxisRange[] {
    return GridUtils.applyItemMoves(start, end, movedItems, false);
  }

  /**
   * Translate the provided UI range into visible range, using the `movedColumns` and `movedRows` to apply the necessary transforms.
   * `movedColumns` and `movedRows` are array of operations done to the UI indexes to re-order items
   *
   * @param uiRange The currently selected UI ranges
   * @param movedColumns The moved column pairs
   * @param movedRows The moved row pairs
   * @returns The model ranges after translation.
   */
  static getVisibleRange(
    modelRange: GridRange,
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = []
  ): GridRange[] {
    return this.translateRange(modelRange, movedColumns, movedRows, false);
  }

  /**
   * Translate the provided model ranges into visible ranges, using the `movedColumns` and `movedRows` to apply the necessary transforms.
   * `movedColumns` and `movedRows` are array of operations done to the UI indexes to re-order items
   *
   * @param modelRanges The model ranges
   * @param movedColumns The moved column pairs
   * @param movedRows The moved row pairs
   * @returns The model ranges after translation.
   */
  static getVisibleRanges(
    modelRanges: GridRange[],
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = []
  ): GridRange[] {
    const visibleRanges = [];
    for (let i = 0; i < modelRanges.length; i += 1) {
      visibleRanges.push(
        ...GridUtils.getVisibleRange(modelRanges[i], movedColumns, movedRows)
      );
    }
    return visibleRanges;
  }

  /**
   * Retrieve the visible index given the currently moved items
   * @param modelIndex The model index to get the visible index for
   * @param movedItems Moved items
   * @returns The visible index of the item
   */
  static getVisibleIndex(
    modelIndex: ModelIndex,
    movedItems: MoveOperation[]
  ): VisibleIndex {
    const visibleIndex = GridUtils.applyItemMoves(
      modelIndex,
      modelIndex,
      movedItems
    )[0][0];

    return visibleIndex;
  }

  /**
   * Retrieve the visible indexes given the currently moved items
   * @param modelIndexes The model indexes to get the visible indexes for
   * @param movedItems Moved items
   * @returns The visible indexes of the item
   */
  static getVisibleIndexes(
    modelIndexes: ModelIndex[],
    movedItems: MoveOperation[]
  ): VisibleIndex[] {
    return modelIndexes.map(i => GridUtils.getVisibleIndex(i, movedItems));
  }

  /**
   * Check if the current platform is Mac
   * @returns True if this platform is a Mac, false otherwise
   */
  static isMacPlatform(): boolean {
    const { platform } = window.navigator;
    return platform.startsWith('Mac');
  }

  /**
   * Get the modifier key for the current platform
   * @returns The modifier key for the current platform
   */
  static getModifierKey(): 'metaKey' | 'ctrlKey' {
    if (GridUtils.isMacPlatform()) {
      return 'metaKey';
    }

    return 'ctrlKey';
  }

  /**
   * Check if the modifier key is down for the given event
   * @param event The event to check
   * @returns True if the modifier key is down, false otherwise
   */
  static isModifierKeyDown(
    event: MouseEvent | KeyboardEvent | React.KeyboardEvent | React.MouseEvent
  ): boolean {
    const modifierKey = GridUtils.getModifierKey();
    return event[modifierKey];
  }

  /**
   * Check if the user has hidden the specified column
   * @param modelIndex The model index to check
   * @param userColumnWidths The user set column widths
   * @returns True if the user has hidden the column
   */
  static checkColumnHidden(
    modelIndex: ModelIndex,
    userColumnWidths: ModelSizeMap
  ): boolean {
    return userColumnWidths.get(modelIndex) === 0;
  }

  /**
   * Check if all the columns specified are hidden
   * @param columns Columns to check
   * @param userColumnWidths The user set column widths
   * @returns True if the user has hidden all of the columns
   */
  static checkAllColumnsHidden(
    columns: ModelIndex[],
    userColumnWidths: ModelSizeMap
  ): boolean {
    if (userColumnWidths.size === 0) {
      return false;
    }
    return columns.every(column => userColumnWidths.get(column) === 0);
  }

  /**
   * Get the bounds the mouse needs to be dragged outside of from an initial selection before scrolling occurs.
   * Taking into account any floating rows that may be covering the viewport.
   * @param metrics Grid metrics
   * @param row The row they started dragging in
   * @param column The column they started the drag from
   * @returns Dimensions of the drag area in relation to the canvas they need to drag outside of to start scrolling
   */
  static getScrollDragBounds(
    metrics: GridMetrics,
    row: GridRangeIndex,
    column: GridRangeIndex
  ): BoxCoordinates {
    const {
      gridX,
      gridY,
      width,
      height,
      floatingTopRowCount,
      floatingBottomRowCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
      floatingLeftWidth,
      floatingRightWidth,
      floatingTopHeight,
      floatingBottomHeight,
      columnCount,
      rowCount,
    } = metrics;
    let x1 = gridX;
    let y1 = gridY;
    let x2 = width;
    let y2 = height;
    if (column != null) {
      if (column > floatingLeftColumnCount) {
        x1 += floatingLeftWidth;
      }
      if (column < columnCount - floatingRightColumnCount) {
        x2 -= floatingRightWidth;
      }
    }

    if (row != null) {
      if (row > floatingTopRowCount) {
        y1 += floatingTopHeight;
      }
      if (row < rowCount - floatingBottomRowCount) {
        y2 -= floatingBottomHeight;
      }
    }
    return { x1, y1, x2, y2 };
  }

  /**
   * Converts the delta coordinates from the provided wheel event to pixels
   * Different platforms have different ways of providing the delta so this normalizes it
   * @param wheelEvent The mouse wheel event to get the scrolling delta for
   * @param pageWidth The width of the page that is scrolling
   * @param pageHeight The height of the page that is scrolling
   * @param lineWidth The width of the line scrolling in line mode
   * @param lineHeight The height of the line scrolling in line mode
   * @returns The delta coordinates normalized to pixels
   */
  static getScrollDelta(
    wheelEvent: GridWheelEvent,
    pageWidth = 1024,
    pageHeight = 768,
    lineWidth = 20,
    lineHeight = 20
  ): { deltaX: number; deltaY: number } {
    let { deltaX, deltaY } = wheelEvent;

    // Flip scroll direction if shiftKey is held on windows/linux.
    // On mac, deltaX/Y values are switched at the event level when shiftKey=true.
    // Guard on strictly Y only changing, to ignore trackpad diagonal motion,
    // through that guard may not be necessary, but it is difficult to determine for
    // all platforms/browser/scroll method combos.
    if (
      !GridUtils.isMacPlatform() &&
      wheelEvent.shiftKey &&
      wheelEvent.deltaX === 0 &&
      wheelEvent.deltaY !== 0
    ) {
      deltaX = wheelEvent.deltaY;
      deltaY = wheelEvent.deltaX;
    }

    // Normalize other deltaMode values to pixel units
    // deltaMode 0, is already in pixel units
    if (wheelEvent?.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      // Users can set OS to be in deltaMode page
      // scrolly by page units as pixels
      deltaX *= pageWidth;
      deltaY *= pageHeight;
    } else if (wheelEvent?.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      // Firefox reports deltaMode line
      // Normalize distance travelled between browsers
      // but remain ~platform/browser combo consistent
      if (GridUtils.isMacPlatform()) {
        // for mac treat lines as a standard row height
        // on mac, firefox travels less distance then chrome per tick
        deltaX = Math.round(deltaX * lineWidth);
        deltaY = Math.round(deltaY * lineHeight);
      } else {
        // for windows convert to pixels using the same method as chrome
        // chrome goes 100 per 3 lines, and firefox would go 102 per 3 (17 lineheight * 3 lines * 2)
        // make the behaviour the same between as it's close enough
        deltaX = Math.round(deltaX * this.PIXELS_PER_LINE);
        deltaY = Math.round(deltaY * this.PIXELS_PER_LINE);
      }
    }

    return { deltaX, deltaY };
  }

  static compareRanges(range1: AxisRange, range2: AxisRange): number {
    if (
      range1[0] == null ||
      range1[1] == null ||
      range2[0] == null ||
      range2[1] == null
    ) {
      return 0;
    }
    return range1[0] !== range2[0]
      ? range1[0] - range2[0]
      : range1[1] - range2[1];
  }

  static mergeSortedRanges(ranges: BoundedAxisRange[]): BoundedAxisRange[] {
    const mergedRanges: BoundedAxisRange[] = [];

    for (let i = 0; i < ranges.length; i += 1) {
      const range = ranges[i];
      const start = range[0];
      const end = range[1];
      if (i === 0) {
        mergedRanges.push([start, end]);
      } else if (start - 1 <= mergedRanges[mergedRanges.length - 1][1]) {
        mergedRanges[mergedRanges.length - 1][1] = Math.max(
          mergedRanges[mergedRanges.length - 1][1],
          end
        );
      } else {
        mergedRanges.push([start, end]);
      }
    }
    return mergedRanges;
  }
}

export default GridUtils;
