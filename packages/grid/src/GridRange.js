class GridRange {
  static SELECTION_DIRECTION = Object.freeze({
    DOWN: 'DOWN',
    UP: 'UP',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
  });

  static normalize(startColumn, startRow, endColumn, endRow) {
    let left = startColumn;
    let top = startRow;
    let right = endColumn;
    let bottom = endRow;

    if (left != null && right != null && right < left) {
      left = right;
      right = startColumn;
    }

    if (top != null && bottom != null && bottom < top) {
      top = bottom;
      bottom = startRow;
    }

    return [left, top, right, bottom];
  }

  /** Make a GridRange, but ensure startColumn <= endColumn, startRow <= endRow */
  static makeNormalized(...coordinates) {
    return new GridRange(...GridRange.normalize(...coordinates));
  }

  static makeCell(column, row) {
    return new GridRange(column, row, column, row);
  }

  static makeColumn(column) {
    return new GridRange(column, null, column, null);
  }

  static makeRow(row) {
    return new GridRange(null, row, null, row);
  }

  static minOrNull(value1, value2) {
    if (value1 == null || value2 == null) {
      return null;
    }

    return Math.min(value1, value2);
  }

  static maxOrNull(value1, value2) {
    if (value1 == null || value2 == null) {
      return null;
    }

    return Math.max(value1, value2);
  }

  /**
   * Consolidate the passed in ranges to the minimum set, merging overlapping ranges.
   * @param {[GridRange]} ranges The ranges to consolidate
   */
  static consolidate(ranges) {
    const result = ranges.slice();

    let wasModified = true;
    while (wasModified) {
      wasModified = false;
      for (let i = 0; i < result.length && !wasModified; i += 1) {
        const range = result[i];
        for (let j = result.length - 1; j > i; j -= 1) {
          const other = result[j];

          // If one contains the other, we can just keep the bigger one
          if (range.contains(other)) {
            result.splice(j, 1);
          } else if (other.contains(range)) {
            wasModified = true;
            result[i] = other;
            result.splice(j, 1);
            break;
          } else if (
            range.startRow === other.startRow &&
            range.endRow === other.endRow
          ) {
            if (range.touches(other)) {
              // If the start/end rows match, and columns touch, consolidate
              const { startRow, endRow } = range;
              const startColumn = GridRange.minOrNull(
                range.startColumn,
                other.startColumn
              );
              const endColumn = GridRange.maxOrNull(
                range.endColumn,
                other.endColumn
              );

              wasModified = true;
              result[i] = new GridRange(
                startColumn,
                startRow,
                endColumn,
                endRow
              );
              result.splice(j, 1);
              break;
            }
          } else if (
            range.startColumn === other.startColumn &&
            range.endColumn === other.endColumn
          ) {
            if (range.touches(other)) {
              // If the start/end rows match, and columns touch, consolidate
              const { startColumn, endColumn } = range;
              const startRow = GridRange.minOrNull(
                range.startRow,
                other.startRow
              );
              const endRow = GridRange.maxOrNull(range.endRow, other.endRow);

              wasModified = true;
              result[i] = new GridRange(
                startColumn,
                startRow,
                endColumn,
                endRow
              );
              result.splice(j, 1);
              break;
            }
          }
        }
      }
    }

    return result;
  }

  static isAxisRangeTouching(start, end, otherStart, otherEnd) {
    if (start == null) {
      if (end == null) {
        return true;
      }

      if (otherStart == null) {
        return true;
      }

      return otherStart <= end + 1;
    }

    if (end == null) {
      if (otherEnd == null) {
        return true;
      }

      return otherEnd >= start - 1;
    }

    if (otherStart == null) {
      if (otherEnd == null) {
        return true;
      }

      return start <= otherEnd + 1;
    }

    if (otherEnd == null) {
      return end >= otherStart - 1;
    }

    if (otherStart >= start - 1) {
      return otherStart <= end + 1;
    }

    return otherEnd >= start - 1;
  }

  static rangeArraysEqual(ranges1, ranges2) {
    if (ranges1 === ranges2) {
      return true;
    }

    if (
      ranges1 == null ||
      ranges2 == null ||
      ranges1.length !== ranges2.length
    ) {
      return false;
    }

    for (let i = 0; i < ranges1.length; i += 1) {
      if (!ranges1[i].equals(ranges2[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the intersection (overlapping area) of two ranges
   * @param {GridRange} range One range to check for the intersection
   * @param {GridRange} otherRange The other range to check for the intersection
   * @returns {GridRange|null} Intersection of the two ranges. If they do not intersect, returns `null`.
   */
  static intersection(range, otherRange) {
    if (range.equals(otherRange)) {
      return range;
    }

    let { startColumn, startRow, endColumn, endRow } = range;
    startColumn =
      startColumn != null && otherRange.startColumn != null
        ? Math.max(startColumn, otherRange.startColumn)
        : startColumn ?? otherRange.startColumn;
    endColumn =
      endColumn != null && otherRange.endColumn != null
        ? Math.min(endColumn, otherRange.endColumn)
        : endColumn ?? otherRange.endColumn;
    startRow =
      startRow != null && otherRange.startRow != null
        ? Math.max(startRow, otherRange.startRow)
        : startRow ?? otherRange.startRow;
    endRow =
      endRow != null && otherRange.endRow != null
        ? Math.min(endRow, otherRange.endRow)
        : endRow ?? otherRange.endRow;

    if (
      (startColumn != null && startColumn > endColumn) ||
      (startRow != null && startRow > endRow)
    ) {
      return null;
    }

    return new GridRange(startColumn, startRow, endColumn, endRow);
  }

  /**
   * @param {GridRange} range The range to be subtracted from
   * @param {GridRange} subtractRange The range to subtract from within this range
   * @returns {GridRange[]} The ranges needed to represent the remaining
   */
  static subtractFromRange(range, subtractRange) {
    const result = [];

    // Make it a little easier by finding only the part the subtraction range intersects
    const subtract = GridRange.intersection(range, subtractRange);
    if (subtract == null) {
      return [range];
    }

    // Go through each of the quadrants for deselection, there can be up to 4
    // Top quadrant (above the subtracted area)
    if (
      subtract.startRow != null &&
      (range.startRow == null || range.startRow < subtract.startRow)
    ) {
      result.push(
        new GridRange(
          range.startColumn,
          range.startRow,
          range.endColumn,
          subtract.startRow - 1
        )
      );
    }

    // middle left
    if (
      subtract.startColumn != null &&
      (range.startColumn == null || range.startColumn < subtract.startColumn)
    ) {
      result.push(
        new GridRange(
          range.startColumn,
          subtract.startRow,
          subtract.startColumn - 1,
          subtract.endRow
        )
      );
    }

    // middle right
    if (
      subtract.endColumn != null &&
      (range.endColumn == null || range.endColumn > subtract.endColumn)
    ) {
      result.push(
        new GridRange(
          subtract.endColumn + 1,
          subtract.startRow,
          range.endColumn,
          subtract.endRow
        )
      );
    }

    // Bottom quadrant
    if (
      subtract.endRow != null &&
      (range.endRow == null || range.endRow > subtract.endRow)
    ) {
      result.push(
        new GridRange(
          range.startColumn,
          subtract.endRow + 1,
          range.endColumn,
          range.endRow
        )
      );
    }

    return result;
  }

  /**
   * Subtract a range from multiple ranges
   * @param {GridRange[]} ranges The ranges to be subtracted from
   * @param {GridRange} subtractRange The range to subtract from within these ranges
   * @returns {GridRange[]} The ranges needed to represent the remaining
   */
  static subtractFromRanges(ranges, subtractRange) {
    const result = [];
    for (let i = 0; i < ranges.length; i += 1) {
      result.push(...GridRange.subtractFromRange(ranges[i], subtractRange));
    }

    return result;
  }

  /**
   * Subtract multiple ranges from multiple ranges
   * @param {GridRange[]} ranges The ranges to be subtracted from
   * @param {GridRange[]} subtractRanges The ranges to subtract from within these ranges
   * @returns {GridRange[]} The ranges needed to represent the remaining
   */
  static subtractRangesFromRanges(ranges, subtractRanges) {
    if (!subtractRanges || subtractRanges.length === 0) {
      return ranges;
    }

    let result = [...ranges];
    for (let i = 0; i < subtractRanges.length; i += 1) {
      result = GridRange.subtractFromRanges(result, subtractRanges[i]);
    }

    return result;
  }

  /**
   * Test if a given range is bounded (all values are non-null)
   * @param {GridRange} range The range to test
   * @returns {boolean} True if this range is bounded, false otherwise
   */
  static isBounded(range) {
    return (
      range.startRow != null &&
      range.startColumn != null &&
      range.endRow != null &&
      range.endColumn != null
    );
  }

  /**
   * Converts any GridRange passed in that is a full row or column selection to be bound
   * to the `columnCount` and `rowCount` passed in
   *
   * @param {GridRange} range The range to get the bounded range of
   * @param {number} columnCount The number of columns
   * @param {number} rowCount The number of rows
   * @returns {GridRange} The passed in GridRange with any null values filled in
   */
  static boundedRange(range, columnCount, rowCount) {
    if (GridRange.isBounded(range)) {
      return range;
    }

    return new GridRange(
      range.startColumn ?? 0,
      range.startRow ?? 0,
      range.endColumn ?? columnCount - 1,
      range.endRow ?? rowCount - 1
    );
  }

  /**
   * Converts the GridRanges passed in to be bound to the `columnCount` and `rowCount` passed in
   *
   * @param {GridRange[]} ranges The ranges to get the bounded ranges of
   * @param {number} columnCount The number of columns
   * @param {number} rowCount The number of rows
   * @returns {GridRange} The passed in GridRange with any null values filled in
   */
  static boundedRanges(ranges, columnCount, rowCount) {
    return ranges.map(r => GridRange.boundedRange(r, columnCount, rowCount));
  }

  /**
   * Offsets a GridRange by the specified amount in the x and y directions
   *
   * @param {GridRange} range The range to offset
   * @param {number} columnOffset The number of columns to offset
   * @param {number} rowOffset The number of rows to offset
   * @returns {GridRange} The new grid range offset from the original
   */
  static offset(range, columnOffset, rowOffset) {
    return new GridRange(
      range.startColumn != null ? range.startColumn + columnOffset : null,
      range.startRow != null ? range.startRow + rowOffset : null,
      range.endColumn != null ? range.endColumn + columnOffset : null,
      range.endRow != null ? range.endRow + rowOffset : null
    );
  }

  /**
   * Get the next cell given the selected ranges and the current cell
   * @param {GridRange[]} ranges The selected bounded ranges within the grid
   * @param {number|null} column The cursor column, or null if none focused
   * @param {number|null} row The cursor row, or null if none focused
   * @param {SELECTION_DIRECTION} direction The direction in which to select next
   * @returns {Cell} The next cell to focus, or null if there should be no more focus
   */
  static nextCell(
    ranges,
    column = null,
    row = null,
    direction = GridRange.SELECTION_DIRECTION.DOWN
  ) {
    if (ranges.length === 0) {
      return null;
    }

    let rangeIndex = -1;
    if (column != null && row != null) {
      rangeIndex = ranges.findIndex(r => r.containsCell(column, row));

      if (rangeIndex >= 0) {
        const range = ranges[rangeIndex];
        const nextCell = range.nextCell(column, row, direction);
        if (nextCell != null) {
          return nextCell;
        }
      }
    }

    // Otherwise go to the start of the next range (could be same range if only one range)
    switch (direction) {
      case GridRange.SELECTION_DIRECTION.DOWN:
      case GridRange.SELECTION_DIRECTION.RIGHT: {
        const nextRangeIndex =
          rangeIndex < ranges.length - 1 ? rangeIndex + 1 : 0;
        const nextRange = ranges[nextRangeIndex];
        return nextRange.startCell(direction);
      }
      case GridRange.SELECTION_DIRECTION.LEFT:
      case GridRange.SELECTION_DIRECTION.UP: {
        const nextRangeIndex =
          rangeIndex > 0 ? rangeIndex - 1 : ranges.length - 1;
        const nextRange = ranges[nextRangeIndex];
        return nextRange.startCell(direction);
      }
      default:
        throw new Error(`Invalid direction: ${direction}`);
    }
  }

  /**
   * Count the number of cells in the provided grid ranges
   * @param {GridRange[]} ranges The ranges to count the rows of
   * @returns {number|NaN} The number of cells in the ranges, or `NaN` if any of the ranges were unbounded
   */
  static cellCount(ranges) {
    return ranges.reduce(
      (cellCount, range) =>
        cellCount +
        ((range.endRow ?? NaN) - (range.startRow ?? NaN) + 1) *
          ((range.endColumn ?? NaN) - (range.startColumn ?? NaN) + 1),
      0
    );
  }

  /**
   * Count the number of rows in the provided grid ranges
   * @param {GridRange[]} ranges The ranges to count the rows of
   * @returns {number|NaN} The number of rows in the ranges, or `NaN` if any of the ranges were unbounded
   */
  static rowCount(ranges) {
    return ranges.reduce(
      (rowCount, range) =>
        rowCount + (range.endRow ?? NaN) - (range.startRow ?? NaN) + 1,
      0
    );
  }

  /**
   * Count the number of columns in the provided grid ranges
   * @param {GridRange[]} ranges The ranges to count the columns of
   * @returns {number|NaN} The number of columns in the ranges, or `NaN` if any of the ranges were unbounded
   */
  static columnCount(ranges) {
    return ranges.reduce(
      (columnCount, range) =>
        columnCount + (range.endColumn ?? NaN) - (range.startColumn ?? NaN) + 1,
      0
    );
  }

  /**
   * Check if the provided ranges contain the provided cell
   * @param {GridRange[]} ranges The ranges to check
   * @param {number} column The column index
   * @param {number} row The row index
   * @returns {boolean} True if the cell is within the provided ranges, false otherwise.
   */
  static containsCell(ranges, column, row) {
    for (let i = 0; i < ranges.length; i += 1) {
      const range = ranges[i];
      if (range.containsCell(column, row)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Iterate through each cell in the provided ranges
   * @param {GridRange[]} ranges The ranges to iterate through
   * @param {(column: number, row: number, index: number) => void} callback The callback to execute. `index` is the index within that range
   * @param {GridRange.SELECTION_DIRECTION} direction The direction to iterate in
   */
  static forEachCell(
    ranges,
    callback,
    direction = GridRange.SELECTION_DIRECTION.RIGHT
  ) {
    for (let i = 0; i < ranges.length; i += 1) {
      ranges[i].forEach(callback, direction);
    }
  }

  constructor(startColumn, startRow, endColumn, endRow) {
    this.startColumn = startColumn;
    this.startRow = startRow;
    this.endColumn = endColumn;
    this.endRow = endRow;
  }

  equals(other) {
    return (
      this.startColumn === other.startColumn &&
      this.startRow === other.startRow &&
      this.endColumn === other.endColumn &&
      this.endRow === other.endRow
    );
  }

  /** @returns {boolean} true if this GridRange completely contains `other` */
  contains(other) {
    return (
      (this.startColumn == null ||
        (other.startColumn != null && this.startColumn <= other.startColumn)) &&
      (this.startRow == null ||
        (other.startRow != null && this.startRow <= other.startRow)) &&
      (this.endColumn == null ||
        (other.endColumn != null && this.endColumn >= other.endColumn)) &&
      (this.endRow == null ||
        (other.endRow != null && this.endRow >= other.endRow))
    );
  }

  /**
   * Check if the provided cell is in this range
   * @param {number} column The column to check
   * @param {number} row The row to check
   * @returns {boolean} True if this cell is within this range
   */
  containsCell(column, row) {
    if (column == null || row == null) {
      return false;
    }

    return (
      (this.startColumn == null || this.startColumn <= column) &&
      (this.endColumn == null || this.endColumn >= column) &&
      (this.startRow == null || this.startRow <= row) &&
      (this.endRow == null || this.endRow >= row)
    );
  }

  /** @returns {boolean} true if this GridRange touches `other` */
  touches(other) {
    return (
      GridRange.isAxisRangeTouching(
        this.startRow,
        this.endRow,
        other.startRow,
        other.endRow
      ) &&
      GridRange.isAxisRangeTouching(
        this.startColumn,
        this.endColumn,
        other.startColumn,
        other.endColumn
      )
    );
  }

  /**
   * @param {GridRange} other The range to deselect from within this range
   * @returns {[GridRange]} The ranges needed to represent the remaining
   */
  subtract(other) {
    return GridRange.subtractFromRange(this, other);
  }

  /**
   * Get the first cell in this range. Throws if this range is unbounded.
   *
   * @param {GridRange.SELECTION_DIRECTION?} direction The direction to get the starting cell in. Defaults to DOWN
   * @returns {{column: number, row: number}} The first cell in this range in the direction specified
   */
  startCell(direction = GridRange.SELECTION_DIRECTION.DOWN) {
    if (!GridRange.isBounded(this)) {
      throw new Error('Cannot get the startCell of an unbounded range');
    }

    switch (direction) {
      case GridRange.SELECTION_DIRECTION.DOWN:
      case GridRange.SELECTION_DIRECTION.RIGHT:
        return { column: this.startColumn, row: this.startRow };
      case GridRange.SELECTION_DIRECTION.LEFT:
      case GridRange.SELECTION_DIRECTION.UP: {
        return { column: this.endColumn, row: this.endRow };
      }
      default:
        throw new Error(`Invalid direction: ${direction}`);
    }
  }

  /**
   * Get the next cell in the direction specified. Throws if this range is unbounded.
   * If already at the bounds of the range in that direction, wrap to the next column or row
   * If at the end of the entire range, return null
   * If outside of the range, returns the next cell closest within this range.
   *
   * @param {number} column The cursor column
   * @param {number} row The cursor row
   * @param {SELECTION_DIRECTION} direction The direction to go in
   * @returns {GridCell|null} The next cell in the direction specified, or `null` if at the end of the range
   */
  nextCell(column, row, direction) {
    if (!GridRange.isBounded(this)) {
      throw new Error('Bounded range required');
    }
    if (column == null || row == null) {
      throw new Error('Require a non-null cursor');
    }

    const { startColumn, endColumn, startRow, endRow } = this;

    switch (direction) {
      case GridRange.SELECTION_DIRECTION.DOWN:
        if (row < endRow) {
          return { column, row: Math.max(row + 1, startRow) };
        }

        if (column < endColumn) {
          return { column: Math.max(column + 1, startColumn), row: startRow };
        }
        break;
      case GridRange.SELECTION_DIRECTION.UP:
        if (row > startRow) {
          return { column, row: Math.min(row - 1, endRow) };
        }

        if (column > startColumn) {
          return { column: Math.min(column - 1, endColumn), row: endRow };
        }
        break;
      case GridRange.SELECTION_DIRECTION.RIGHT:
        if (column < endColumn) {
          return { column: Math.max(column + 1, startColumn), row };
        }

        if (row < endRow) {
          return { column: startColumn, row: Math.max(row + 1, startRow) };
        }
        break;
      case GridRange.SELECTION_DIRECTION.LEFT:
        if (column > startColumn) {
          return { column: Math.min(column - 1, endColumn), row };
        }

        if (row > startRow) {
          return { column: endColumn, row: Math.min(row - 1, endRow) };
        }
        break;
      default:
        throw new Error(`Invalid direction: ${direction}`);
    }

    return null;
  }

  /**
   * Iterate through each cell in the range
   * @param {(column:number, row:number, index:number) => void} callback Callback to execute. `index` is the index within this range
   * @param {GridRange.SELECTION_DIRECTION} direction The direction to iterate in
   */
  forEach(callback, direction = GridRange.SELECTION_DIRECTION.RIGHT) {
    let i = 0;
    let { column: c, row: r } = this.startCell(direction);
    while (c != null && r != null) {
      callback(c, r, i);
      i += 1;

      ({ column: c, row: r } = this.nextCell(c, r, direction) ?? {});
    }
  }
}

export default GridRange;
