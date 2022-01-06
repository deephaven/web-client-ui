import React from 'react';
import GridRange, { GridRangeIndex } from './GridRange';
import {
  BoxCoordinates,
  Coordinate,
  CoordinateMap,
  VisibleIndex,
  IndexModelMap,
  ModelIndex,
  ModelSizeMap,
  MoveOperation,
  SizeMap,
} from './GridMetrics';
import type { GridMetrics } from './GridMetrics';
import { GridTheme } from './GridTheme';

export type AxisRange = [start: VisibleIndex, end: VisibleIndex];

export type GridAxisRange = [start: GridRangeIndex, end: GridRangeIndex];

export type GridPoint = {
  x: Coordinate;
  y: Coordinate;
  column: GridRangeIndex;
  row: GridRangeIndex;
};

export type IndexCallback<T> = (itemIndex: VisibleIndex) => T | undefined;

class GridUtils {
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

    return { x, y, row, column };
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
    itemSizes: SizeMap
  ): VisibleIndex | null {
    const floatingItem = GridUtils.iterateFloating(
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
    if (floatingItem !== undefined) {
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
    metrics: GridMetrics
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
      visibleColumnWidths
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
    modelIndexes: IndexModelMap,
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
    } = metrics;
    const { allowColumnResize, headerSeparatorHandleSize } = theme;

    if (
      columnHeaderHeight < y ||
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
   * @param to The visible index to move the itme to
   * @param oldMovedItems The old reordered items
   * @returns The new reordered items
   */
  static moveItem(
    from: VisibleIndex,
    to: VisibleIndex,
    oldMovedItems: MoveOperation[] = []
  ): MoveOperation[] {
    if (from === to) {
      return oldMovedItems;
    }

    const movedItems: MoveOperation[] = [...oldMovedItems];

    if (
      movedItems.length > 0 &&
      movedItems[movedItems.length - 1].to === from
    ) {
      movedItems[movedItems.length - 1] = {
        ...movedItems[movedItems.length - 1],
        to,
      };
    } else {
      movedItems.push({ from, to });
    }

    return movedItems;
  }

  /**
   * Retrieve the model index given the currently moved items
   * @param visibleIndex The visible index of the item to get the model index for
   * @param movedItems The moved items
   * @returns The model index of the item
   */
  static getModelIndex(
    visibleIndex: VisibleIndex,
    movedItems: MoveOperation[] = []
  ): ModelIndex {
    let modelIndex = visibleIndex;

    for (let i = movedItems.length - 1; i >= 0; i -= 1) {
      const movedItem = movedItems[i];
      if (modelIndex === movedItem.to) {
        ({ from: modelIndex } = movedItem);
      } else if (movedItem.from <= modelIndex && modelIndex < movedItem.to) {
        modelIndex += 1;
      } else if (movedItem.to < modelIndex && modelIndex <= movedItem.from) {
        modelIndex -= 1;
      }
    }

    return modelIndex;
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
  ): GridAxisRange[] {
    if (start == null || end == null) {
      return [[start, end]];
    }

    let result: [VisibleIndex, VisibleIndex][] = [[start, end]];
    if (start == null) {
      return result;
    }

    // movedItems is built by adding a new item whenever an item in the UI is dragged/moved, transforming a model
    // index to the new UI index. We want to find the model index from the UI index here, so we unwind the
    // transformations applied - the start/end axis range passed in is the current UI range, so we need to apply
    // the transformations starting at the end of the chain backward to find the appropriate model indexes
    for (let i = movedItems.length - 1; i >= 0; i -= 1) {
      const { from, to } = movedItems[i];
      const nextResult: [VisibleIndex, VisibleIndex][] = [];
      for (let j = 0; j < result.length; j += 1) {
        const [currentStart, currentEnd] = result[j];
        const startLength = nextResult.length;
        if (from <= currentStart) {
          // From before
          if (to > currentEnd) {
            // To after
            nextResult.push([currentStart + 1, currentEnd + 1]);
          } else if (to >= currentStart) {
            // To within
            nextResult.push([from, from]);
            nextResult.push([currentStart + 1, currentEnd]);
          }
        } else if (from > currentEnd) {
          // From after
          if (to < currentStart) {
            // To before
            nextResult.push([currentStart - 1, currentEnd - 1]);
          } else if (to <= currentEnd) {
            // To within
            nextResult.push([from, from]);
            nextResult.push([currentStart, currentEnd - 1]);
          }
        } else if (to < currentStart) {
          // From within to before
          nextResult.push([currentStart - 1, from - 1]);
          nextResult.push([from + 1, currentEnd]);
        } else if (to > currentEnd) {
          // From within to after
          nextResult.push([currentStart, from - 1]);
          nextResult.push([from + 1, currentEnd + 1]);
        } else if (from > to) {
          // From within after to within before
          if (to > currentStart) {
            nextResult.push([currentStart, to - 1]);
          }
          nextResult.push([from, from]);
          nextResult.push([to, from - 1]);
          if (from < currentEnd) {
            nextResult.push([from + 1, currentEnd]);
          }
        } else if (from < to) {
          // From within before to within after
          if (from > currentStart) {
            nextResult.push([currentStart, from - 1]);
          }
          nextResult.push([from + 1, to]);
          nextResult.push([from, from]);
          if (from < currentEnd) {
            nextResult.push([to + 1, currentEnd]);
          }
        }

        if (startLength === nextResult.length) {
          // No modifications were made, add the original range indexes
          nextResult.push([currentStart, currentEnd]);
        }
      }
      result = nextResult;
    }
    return result;
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
    const columnRanges = GridUtils.getModelRangeIndexes(
      uiRange.startColumn,
      uiRange.endColumn,
      movedColumns
    );
    const rowRanges = GridUtils.getModelRangeIndexes(
      uiRange.startRow,
      uiRange.endRow,
      movedRows
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
   * Retrieve the visible index given the currently moved items
   * @param modelIndex The model index to get the visible index for
   * @param movedItems Moved items
   * @returns The visible index of the item
   */
  static getVisibleIndex(
    modelIndex: ModelIndex,
    movedItems: MoveOperation[] = []
  ): VisibleIndex {
    let visibleIndex = modelIndex;

    for (let i = 0; i < movedItems.length; i += 1) {
      const movedItem = movedItems[i];
      if (visibleIndex === movedItem.from) {
        ({ to: visibleIndex } = movedItem);
      } else if (
        movedItem.from < visibleIndex &&
        visibleIndex <= movedItem.to
      ) {
        visibleIndex -= 1;
      } else if (
        movedItem.to <= visibleIndex &&
        visibleIndex < movedItem.from
      ) {
        visibleIndex += 1;
      }
    }

    return visibleIndex;
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
    wheelEvent: WheelEvent | React.WheelEvent,
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
}

export default GridUtils;
