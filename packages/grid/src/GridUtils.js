import GridRange from './GridRange';

class GridUtils {
  // use same constant as chrome source for windows
  // https://github.com/chromium/chromium/blob/973af9d461b6b5dc60208c8d3d66adc27e53da78/ui/events/blink/web_input_event_builders_win.cc#L285
  static PIXELS_PER_LINE = 100 / 3;

  static getGridPointFromXY(x, y, metrics) {
    const column = GridUtils.getColumnAtX(x, metrics);
    const row = GridUtils.getRowAtY(y, metrics);

    return { x, y, row, column };
  }

  static iterateFloatingStart(start, total, callback) {
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
   */
  static iterateFloatingEnd(end, total, callback) {
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
   * @param {number} start Count of start floating rows, eg. floatingTopRowCount
   * @param {number} end Count of end floating rows, eg. floatingBottomRowCount
   * @param {number} total Total number of items
   * @param {(itemIndex:number) => any | undefined} callback Callback called for each value, stopping the iterating and returning the value if one is returned
   */
  static iterateFloating(start, end, total, callback) {
    const result = GridUtils.iterateFloatingStart(start, total, callback);
    if (result !== undefined) {
      return result;
    }
    return GridUtils.iterateFloatingEnd(end, total, callback);
  }

  static iterateAllItems(
    visibleStart,
    visibleEnd,
    floatingStartCount,
    floatingEndCount,
    totalCount,
    callback
  ) {
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

  static isInItem(itemIndex, itemXs, itemSizes, x) {
    const itemX = itemXs.get(itemIndex);
    const itemSize = itemSizes.get(itemIndex);
    return itemX <= x && x <= itemX + itemSize;
  }

  static getItemAtOffset(
    offset,
    itemCount,
    floatingStart,
    floatingEnd,
    items,
    itemXs,
    itemSizes
  ) {
    const floatingItem = GridUtils.iterateFloating(
      floatingStart,
      floatingEnd,
      itemCount,
      item => {
        if (GridUtils.isInItem(item, itemXs, itemSizes, offset)) {
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
      if (GridUtils.isInItem(item, itemXs, itemSizes, offset)) {
        return item;
      }
    }

    return null;
  }

  static getColumnAtX(x, metrics) {
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

  static getRowAtY(y, metrics) {
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
   * @param {Number} startIndex The index to start from
   * @param {Map} modelIndexes The mapping of model indexes
   * @param {Number[]} visibleItems The visible items
   * @param {Map} userSizes The user set sizes
   */
  static getNextShownItem(startIndex, modelIndexes, visibleItems, userSizes) {
    let visibleItemIndex =
      visibleItems.findIndex(value => value === startIndex) || 0;
    visibleItemIndex -= 1;
    while (visibleItemIndex != null && visibleItemIndex >= 0) {
      const item = visibleItems[visibleItemIndex];
      const modelIndex = modelIndexes.get(item);
      if (userSizes.get(modelIndex) !== 0) {
        return item;
      }

      visibleItemIndex -= 1;
    }

    return null;
  }

  /**
   * Iterate backward through the visible columns until a shown column is hit
   * @param {Number} columnIndex The column index to start iterating backward from
   * @param {GridMetrics} metrics The GridMetricCalculator metrics
   */
  static getNextShownColumn(startIndex, metrics) {
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
   * @param {Number} rowIndex The row index to start iterating backward from
   * @param {GridMetrics} metrics The GridMetricCalculator metrics
   */
  static getNextShownRow(startIndex, metrics) {
    const { modelRows, visibleRows, userRowHeights } = metrics;
    return GridUtils.getNextShownItem(
      startIndex,
      modelRows,
      visibleRows,
      userRowHeights
    );
  }

  /**
   * Gets the column index if the x/y coordinated provided are close enough
   * @param {Number} x Mouse x coordinate
   * @param {Number} y Mouse y coordinate
   * @param {GridMetrics} metrics The GridMetricCalculator metrics
   * @param {GridTheme} theme The grid theme with potantial user overrides
   * @returns {Number|null} Column index or null
   */
  static getColumnSeparatorIndex(x, y, metrics, theme) {
    const {
      rowHeaderWidth,
      columnHeaderHeight,
      floatingColumns,
      visibleColumns,
      visibleColumnXs,
      visibleColumnWidths,
      floatingLeftColumnCount,
    } = metrics;
    const { allowColumnResize, headerSeparatorHandleSize } = theme;
    const floatingLeftColumnsWidth =
      visibleColumnXs.get(floatingLeftColumnCount - 1) +
      visibleColumnWidths.get(floatingLeftColumnCount - 1);

    if (
      columnHeaderHeight < y ||
      !allowColumnResize ||
      headerSeparatorHandleSize <= 5
    ) {
      return null;
    }

    const gridX = x - rowHeaderWidth;
    const halfSeparatorSize = headerSeparatorHandleSize * 0.5;

    // Iterate through the floating columns first since they're on top
    let isPreviousColumnHidden = false;
    for (let i = floatingColumns.length - 1; i >= 0; i -= 1) {
      const column = floatingColumns[i];
      const columnX = visibleColumnXs.get(column);
      const columnWidth = visibleColumnWidths.get(column);
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
      const columnX = visibleColumnXs.get(column);
      const columnWidth = visibleColumnWidths.get(column);
      const isColumnHidden = columnWidth === 0;

      // If this column is under the floating columns "layer". Terminate early.
      if (columnX < floatingLeftColumnsWidth - columnWidth) {
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

  static isItemHidden(itemIndex, visibleSizes) {
    return visibleSizes.get(itemIndex) === 0;
  }

  static isColumnHidden(columnIndex, metrics) {
    const { visibleColumnWidths } = metrics;
    return GridUtils.isItemHidden(columnIndex, visibleColumnWidths);
  }

  /**
   * Check if the provided row is a floating row
   * @param {number} row The row index to check
   * @param {GridMetrics} metrics The grid metrics to check against
   */
  static isFloatingRow(row, metrics) {
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
   * @param {number} column The column index to check
   * @param {GridMetrics} metrics The grid metrics to check against
   */
  static isFloatingColumn(column, metrics) {
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

  static getHiddenItems(itemIndex, visibleSizes, visibleItems) {
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

  static getHiddenColumns(columnIndex, metrics) {
    const { visibleColumns, visibleColumnWidths } = metrics;
    return GridUtils.getHiddenItems(
      columnIndex,
      visibleColumnWidths,
      visibleColumns
    );
  }

  // Returns the row index if the x/y coordinates provided are close enough to the separator, otherwise false
  static getRowSeparatorIndex(x, y, metrics, theme) {
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
      const rowY = visibleRowYs.get(row);
      const rowHeight = visibleRowHeights.get(row);
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

  static isRowHidden(rowIndex, metrics) {
    const { visibleRowHeights } = metrics;
    return GridUtils.isItemHidden(rowIndex, visibleRowHeights);
  }

  static getHiddenRows(rowIndex, metrics) {
    const { visibleRows, visibleRowHeights } = metrics;
    return GridUtils.getHiddenItems(rowIndex, visibleRowHeights, visibleRows);
  }

  /**
   * Set a new order for items in the grid
   * @param {Number} from The visible index to move from
   * @param {Number} to The visible index to move the itme to
   * @param {Array} oldMovedItems The old reordered items
   * @returns {Number} The new reordered items
   */
  static moveItem(from, to, oldMovedItems = []) {
    if (from === to) {
      return oldMovedItems;
    }

    const movedItems = [].concat(oldMovedItems);

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
   * @param {Number} visibleIndex The visible index of the item to get the model index for
   * @param {Array} movedItems The moved items
   * @returns {Number} The model index of the item
   */
  static getModelIndex(visibleIndex, movedItems = []) {
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
   * @param {number} start Start item in one dimension
   * @param {number} end End item in one dimension
   * @param {MovedItem[]} movedItems Moved item pairs in this dimension
   * @returns {AxisRange[]} Array of start/end pairs of the indexes after transformations applied.
   */
  static getModelRangeIndexes(start, end, movedItems) {
    let result = [[start, end]];
    if (start == null) {
      return result;
    }

    // movedItems is built by adding a new item whenever an item in the UI is dragged/moved, transforming a model
    // index to the new UI index. We want to find the model index from the UI index here, so we unwind the
    // transformations applied - the start/end axis range passed in is the current UI range, so we need to apply
    // the transformations starting at the end of the chain backward to find the appropriate model indexes
    for (let i = movedItems.length - 1; i >= 0; i -= 1) {
      const { from, to } = movedItems[i];
      const nextResult = [];
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
   * @param {GridRange} uiRange The currently selected UI ranges
   * @param {Array} movedColumns The moved column pairs
   * @param {Array} movedRows The moved row pairs
   * @returns {GridRange[]} The model ranges after translation.
   */
  static getModelRange(uiRange, movedColumns = [], movedRows = []) {
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
    const ranges = [];
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
   * @param {GridRange[]} uiRanges The currently selected UI ranges
   * @param {Array} movedColumns The moved column pairs
   * @param {Array} movedRows The moved row pairs
   * @returns {GridRange[]} The model ranges after translation.
   */
  static getModelRanges(uiRanges, movedColumns = [], movedRows = []) {
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
   * @param {Number} modelIndex The model index to get the visible index for
   * @param {Array} movedItems Moved items
   * @returns {Number} The visible index of the item
   */
  static getVisibleIndex(modelIndex, movedItems = []) {
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

  static isMacPlatform() {
    const { platform } = window.navigator;
    return platform.startsWith('Mac');
  }

  static getModifierKey() {
    if (GridUtils.isMacPlatform()) {
      return 'metaKey';
    }

    return 'ctrlKey';
  }

  static isModifierKeyDown(event) {
    const modifierKey = GridUtils.getModifierKey();
    return event[modifierKey];
  }

  static checkColumnHidden(modelIndex, userColumnWidths) {
    return userColumnWidths.get(modelIndex) === 0;
  }

  static checkAllColumnsHidden(columns, userColumnWidths) {
    if (userColumnWidths.size === 0) {
      return false;
    }
    return columns.every(column => userColumnWidths.get(column) === 0);
  }

  /**
   * Get the bounds the mouse needs to be dragged outside of from an initial selection before scrolling occurs.
   * Taking into account any floating rows that may be covering the viewport.
   * @param {GridMetrics} metrics Grid metrics
   * @param {number} row The row they started dragging in
   * @param {number} column The column they started the drag from
   * @returns Dimensions of the drag area in relation to the canvas they need to drag outside of to start scrolling
   */
  static getScrollDragBounds(metrics, row, column) {
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
    let x = gridX;
    let y = gridY;
    let x2 = width;
    let y2 = height;
    if (column != null) {
      if (column > floatingLeftColumnCount) {
        x += floatingLeftWidth;
      }
      if (column < columnCount - floatingRightColumnCount) {
        x2 -= floatingRightWidth;
      }
    }

    if (row != null) {
      if (row > floatingTopRowCount) {
        y += floatingTopHeight;
      }
      if (row < rowCount - floatingBottomRowCount) {
        y2 -= floatingBottomHeight;
      }
    }
    return { x, y, x2, y2 };
  }

  /**
   * Converts the delta coordinates from the provided wheel event to pixels
   * Different platforms have different ways of providing the delta so this normalizes it
   * @param {WheelEvent} wheelEvent The mouse wheel event to get the scrolling delta for
   * @param {number?} pageWidth The width of the page that is scrolling
   * @param {number?} pageHeight The height of the page that is scrolling
   * @param {number?} lineWidth The width of the line scrolling in line mode
   * @param {number?} lineHeight The height of the line scrolling in line mode
   * @returns {{deltaX:number, deltaY: number}} The delta coordinates normalized to pixels
   */
  static getScrollDelta(
    wheelEvent,
    pageWidth = 1024,
    pageHeight = 768,
    lineWidth = 20,
    lineHeight = 20
  ) {
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
