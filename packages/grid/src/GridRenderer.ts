import memoizeClear from './memoizeClear';
import GridUtils from './GridUtils';
import GridColorUtils from './GridColorUtils';
import { isExpandableGridModel } from './ExpandableGridModel';
import {
  GridColor,
  GridColorWay,
  GridTheme,
  NullableGridColor,
} from './GridTheme';
import GridModel from './GridModel';
import GridRange from './GridRange';
import GridMetrics, {
  BoxCoordinates,
  Coordinate,
  VisibleIndex,
} from './GridMetrics';
import { getOrThrow } from './GridMetricCalculator';
import { isEditableGridModel } from './EditableGridModel';

export type EditingCellTextSelectionRange = [start: number, end: number];

type NoneNullColumnRange = { startColumn: number; endColumn: number };

type NoneNullRowRange = { startRow: number; endRow: number };

export type EditingCell = {
  // Index of the editing cell
  column: VisibleIndex;
  row: VisibleIndex;

  // Selection within the text
  selectionRange?: EditingCellTextSelectionRange;

  // The value to use for the edit
  value: string;

  // Whether the selection was triggered with a quick edit action (e.g. Start typing with the cell in focus)
  isQuickEdit?: boolean;
};

export type GridRenderState = {
  // The top/left cell of the scrolled viewport
  left: VisibleIndex;
  top: VisibleIndex;

  // Width and height of the total canvas area
  width: number;
  height: number;

  // The canvas context
  context: CanvasRenderingContext2D;

  // The grid theme
  theme: GridTheme;

  // The model used by the grid
  model: GridModel;

  // The grid metrics
  metrics: GridMetrics;

  // Location of the mouse on the grid
  mouseX: number | null;
  mouseY: number | null;

  // Where the keyboard cursor is located
  cursorColumn: VisibleIndex | null;
  cursorRow: VisibleIndex | null;

  // Currently selected ranges
  selectedRanges: GridRange[];

  // Currently dragged column/row information
  draggingColumn: VisibleIndex | null;
  draggingColumnOffset: number | null;
  draggingColumnSeparator: VisibleIndex | null;
  draggingRow: VisibleIndex | null;
  draggingRowOffset: number | null;
  draggingRowSeparator: VisibleIndex | null;

  // The currently editing cell
  editingCell: EditingCell | null;
  isDraggingHorizontalScrollBar: boolean;
  isDraggingVerticalScrollBar: boolean;
  isDragging: boolean;
};

/* eslint react/destructuring-assignment: "off" */
/* eslint class-methods-use-this: "off" */
/* eslint no-param-reassign: "off" */
/**
 * A GridRenderer handles rendering the different parts of the grid
 * This default rendering just renders a basic grid. Extend this class and implement
 * your own methods to customize drawing of the grid (eg. Draw icons or special features)
 */
export class GridRenderer {
  // Default font width in pixels if it cannot be retrieved from the context
  static DEFAULT_FONT_WIDTH = 10;

  // Default radius in pixels for corners for some elements (like the active cell)
  static DEFAULT_EDGE_RADIUS = 2;

  // Default width in pixels for the border of the active cell
  static ACTIVE_CELL_BORDER_WIDTH = 2;

  static compareColumns(
    range1: NoneNullColumnRange,
    range2: NoneNullColumnRange
  ): number {
    if (
      range1.startColumn == null ||
      range1.endColumn == null ||
      range2.startColumn == null ||
      range2.endColumn == null
    ) {
      return 0;
    }

    if (range1.startColumn < range2.startColumn) {
      return -1;
    }
    if (range1.startColumn > range2.startColumn) {
      return 1;
    }
    return range1.endColumn - range2.endColumn;
  }

  static compareRows(
    range1: NoneNullRowRange,
    range2: NoneNullRowRange
  ): number {
    if (
      range1.startRow == null ||
      range1.endRow == null ||
      range2.startRow == null ||
      range2.endRow == null
    ) {
      return 0;
    }

    if (range1.startRow < range2.startRow) {
      return -1;
    }
    if (range1.startRow > range2.startRow) {
      return 1;
    }
    return range1.endRow - range2.endRow;
  }

  /**
   * Truncate a string to the specified length and add ellipses if necessary
   * @param str The string to truncate
   * @param len The length to truncate the string to. If longer than the actual string, just returns the string
   * @returns The truncated string
   */
  static truncate(str: string, len: number): string {
    if (len < str.length) {
      // eslint-disable-next-line prefer-template
      return str.substr(0, len) + '…';
    }
    return str;
  }

  /**
   * Uses binary search to truncate a string to fit in the provided width
   * @param context The drawing context to measure the text in
   * @param str The string to get the maximum length it can draw
   * @param width The width to truncate it to
   * @param start The low boundary to start the search
   * @param end The high boundary to start the search
   * @param truncationChar This char will be repeated as the display string if the string is truncated instead of just adding an ellipsis
   * @returns The truncated string
   */
  static binaryTruncateToWidth(
    context: CanvasRenderingContext2D,
    str: string,
    width: number,
    start = 0,
    end = str.length,
    truncationChar?: string
  ): string {
    if (end >= str.length && context.measureText(str).width <= width) {
      // IDS-6069 If the whole string can fit, don't bother checking for truncation
      // The ellipses are actually slightly wider than other chars, and it's possible
      // that the "truncation" ends up being slightly longer, which messes up the search
      // algorithm below.
      // Besides, if we already fit, it's just faster to not bother checking other truncations.
      return str;
    }

    if (truncationChar) {
      const charWidth = context.measureText(truncationChar).width;
      return truncationChar.repeat(Math.max(1, Math.floor(width / charWidth)));
    }

    let lo = start;
    let hi = Math.min(str.length - 1, end);
    let result = str;
    while (hi >= lo) {
      const mid = Math.ceil((hi + lo) / 2);
      const truncatedStr = GridRenderer.truncate(str, mid);
      if (context.measureText(truncatedStr).width <= width) {
        result = truncatedStr;
        if (lo === mid) {
          break;
        }
        lo = mid;
      } else if (mid === 0) {
        // We already truncated to zero chars and it still doesn't fit, no need to keep looking
        result = truncatedStr;
        break;
      } else {
        hi = mid - 1;
      }
    }

    return result;
  }

  /**
   * Truncate a string (if necessary) to fit in the specified width.
   * First uses the estimated font width to calculate a lower/upper bound
   * Then uses binary search within those bounds to find the exact max length
   * @param context The drawing context
   * @param str The string to calculate max length for
   * @param width The width to truncate within
   * @param fontWidth The estimated width of each character
   * @param truncationChar This char will be repeated as the display string if the string is truncated instead of just adding an ellipsis
   * @returns The truncated string that fits within the width provided
   */
  static truncateToWidth(
    context: CanvasRenderingContext2D,
    str: string,
    width: number,
    fontWidth = GridRenderer.DEFAULT_FONT_WIDTH,
    truncationChar?: string
  ): string {
    if (width <= 0 || str.length <= 0) {
      return '';
    }

    // Estimate the possible low and high boundaries for truncating the text
    // Use the width of the space divided by the estimated width of each character,
    // and take half that as the low (minus 5 just to be extra safe), and double that as the high.
    const lo = Math.min(
      Math.max(0, Math.floor(width / fontWidth / 2) - 5),
      str.length
    );
    const hi = Math.min(Math.ceil((width / fontWidth) * 2), str.length);

    return GridRenderer.binaryTruncateToWidth(
      context,
      str,
      width,
      lo,
      hi,
      truncationChar
    );
  }

  /**
   * Draw the grid canvas with the state provided
   * @param state The state of the grid
   */
  drawCanvas(state: GridRenderState): void {
    const { context } = state;

    context.save();

    this.configureContext(context, state);

    this.drawBackground(context, state);

    this.drawGrid(context, state);

    this.drawHeaders(context, state);

    this.drawFooters(context, state);

    this.drawDraggingColumn(context, state);

    this.drawDraggingRow(context, state);

    this.drawScrollBars(context, state);

    context.restore();
  }

  configureContext(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { theme } = state;
    context.font = theme.font;
    context.textBaseline = 'middle';
    context.lineCap = 'butt';
  }

  drawBackground(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { theme, metrics } = state;
    const { width, height } = metrics;
    context.fillStyle = theme.backgroundColor;
    context.fillRect(0, 0, width, height);
  }

  drawGrid(context: CanvasRenderingContext2D, state: GridRenderState): void {
    const { metrics, draggingRow, draggingColumn } = state;
    const { gridX, gridY } = metrics;

    context.translate(gridX, gridY);

    this.drawGridBackground(
      context,
      state,
      draggingRow == null && draggingColumn == null
    );

    this.drawCellContents(context, state);

    this.drawFloatingRows(context, state);

    this.drawFloatingColumns(context, state);

    context.translate(-gridX, -gridY);
  }

  drawFloatingRows(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { draggingRow, draggingColumn, metrics, theme } = state;
    const {
      floatingTopRowCount,
      floatingBottomRowCount,
      floatingRows,
      rowCount,
      visibleColumns,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;

    if (floatingRows.length === 0) {
      return;
    }

    if (theme.floatingRowBackgroundColors) {
      this.drawRowStripesForRows(
        context,
        state,
        floatingRows,
        theme.floatingRowBackgroundColors
      );
    }

    if (draggingRow == null && draggingColumn == null) {
      this.drawFloatingMouseRowHover(context, state);
    }

    this.drawGridLinesForItems(
      context,
      state,
      visibleColumns,
      floatingRows,
      theme.floatingGridColumnColor,
      theme.floatingGridRowColor
    );

    this.drawCellBackgroundsForItems(
      context,
      state,
      visibleColumns,
      floatingRows
    );

    this.drawFloatingBorders(context, state);

    // Draw the floating row selection...
    if (floatingTopRowCount > 0) {
      this.drawSelectedRanges(context, state, {
        top: 0,
        bottom: floatingTopRowCount - 1,
        maxY:
          getOrThrow(visibleRowYs, floatingTopRowCount - 1) +
          getOrThrow(visibleRowHeights, floatingTopRowCount - 1) -
          0.5,
      });
    }
    if (floatingBottomRowCount > 0) {
      this.drawSelectedRanges(context, state, {
        top: rowCount - floatingBottomRowCount - 1,
        bottom: rowCount - 1,
        minY: getOrThrow(visibleRowYs, rowCount - floatingBottomRowCount) + 0.5,
        maxY:
          getOrThrow(visibleRowYs, rowCount - 1) +
          getOrThrow(visibleRowHeights, rowCount - 1) -
          0.5,
      });
    }

    // Draw the cell content...
    for (let c = 0; c < visibleColumns.length; c += 1) {
      const column = visibleColumns[c];
      for (let r = 0; r < floatingRows.length; r += 1) {
        const row = floatingRows[r];
        this.drawCellContent(context, state, column, row);
      }
    }
  }

  drawFloatingColumns(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { draggingRow, draggingColumn, metrics, theme } = state;
    const {
      floatingLeftColumnCount,
      floatingRightColumnCount,
      floatingLeftWidth,
      floatingRightWidth,
      floatingColumns,
      gridX,
      maxX,
      columnCount,
      visibleRows,
      visibleColumnXs,
      visibleColumnWidths,
      width,
      height,
    } = metrics;

    if (floatingColumns.length === 0) {
      return;
    }

    if (theme.floatingRowBackgroundColors) {
      this.drawRowStripesForRows(
        context,
        state,
        visibleRows,
        theme.floatingRowBackgroundColors,
        0,
        floatingLeftWidth
      );
      this.drawRowStripesForRows(
        context,
        state,
        visibleRows,
        theme.floatingRowBackgroundColors,
        width - gridX - floatingRightWidth,
        maxX
      );
    }

    if (draggingRow == null && draggingColumn == null) {
      this.drawFloatingMouseRowHover(context, state);
    }

    // Clip floated column grid lines.
    context.save();
    context.beginPath();
    context.rect(0, 0, floatingLeftWidth, height);
    context.clip();

    this.drawGridLinesForItems(
      context,
      state,
      floatingColumns,
      visibleRows,
      theme.floatingGridColumnColor,
      theme.floatingGridRowColor
    );

    context.restore();

    this.drawCellBackgroundsForItems(
      context,
      state,
      floatingColumns,
      visibleRows
    );

    this.drawFloatingBorders(context, state);

    // Draw the floating column selection...
    if (floatingLeftColumnCount > 0) {
      this.drawSelectedRanges(context, state, {
        left: 0,
        maxX:
          getOrThrow(visibleColumnXs, floatingLeftColumnCount - 1) +
          getOrThrow(visibleColumnWidths, floatingLeftColumnCount - 1),
      });
    }
    if (floatingRightColumnCount > 0) {
      this.drawSelectedRanges(context, state, {
        left: columnCount - floatingRightColumnCount,
        right: columnCount - 1,
        minX:
          getOrThrow(visibleColumnXs, columnCount - floatingRightColumnCount) +
          0.5,
        maxX:
          getOrThrow(visibleColumnXs, columnCount - 1) +
          getOrThrow(visibleColumnWidths, columnCount - 1),
      });
    }

    // Draw the cell content...
    for (let c = 0; c < floatingColumns.length; c += 1) {
      const column = floatingColumns[c];
      for (let r = 0; r < visibleRows.length; r += 1) {
        const row = visibleRows[r];
        this.drawCellContent(context, state, column, row);
      }
    }
  }

  drawFloatingBorders(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { metrics, theme } = state;
    const {
      floatingTopRowCount,
      floatingBottomRowCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
      rowCount,
      columnCount,
      visibleRowYs,
      visibleColumnXs,
      visibleRowHeights,
      visibleColumnWidths,
      maxX,
      maxY,
    } = metrics;
    const { floatingDividerOuterColor, floatingDividerInnerColor } = theme;

    context.lineWidth = 3;
    context.beginPath();
    context.strokeStyle = floatingDividerOuterColor;

    if (floatingTopRowCount > 0) {
      const y =
        getOrThrow(visibleRowYs, floatingTopRowCount - 1) +
        getOrThrow(visibleRowHeights, floatingTopRowCount - 1) +
        0.5;
      context.moveTo(0, y);
      context.lineTo(maxX, y);
    }

    if (floatingBottomRowCount > 0) {
      const y =
        getOrThrow(visibleRowYs, rowCount - floatingBottomRowCount) - 0.5;
      context.moveTo(0, y);
      context.lineTo(maxX, y);
    }

    if (floatingLeftColumnCount > 0) {
      const x =
        getOrThrow(visibleColumnXs, floatingLeftColumnCount - 1) +
        getOrThrow(visibleColumnWidths, floatingLeftColumnCount - 1) +
        0.5;
      context.moveTo(x, 0);
      context.lineTo(x, maxY);
    }

    if (floatingRightColumnCount > 0) {
      const x =
        getOrThrow(visibleColumnXs, columnCount - floatingRightColumnCount) -
        0.5;
      context.moveTo(x, 0);
      context.lineTo(x, maxY);
    }

    context.stroke();

    context.beginPath();
    context.lineWidth = 1;
    context.strokeStyle = floatingDividerInnerColor;

    if (floatingTopRowCount > 0) {
      const y =
        getOrThrow(visibleRowYs, floatingTopRowCount - 1) +
        getOrThrow(visibleRowHeights, floatingTopRowCount - 1) +
        0.5;
      context.moveTo(0, y);
      context.lineTo(maxX, y);
    }

    if (floatingBottomRowCount > 0) {
      const y =
        getOrThrow(visibleRowYs, rowCount - floatingBottomRowCount) - 0.5;
      context.moveTo(0, y);
      context.lineTo(maxX, y);
    }

    if (floatingLeftColumnCount > 0) {
      const x =
        getOrThrow(visibleColumnXs, floatingLeftColumnCount - 1) +
        getOrThrow(visibleColumnWidths, floatingLeftColumnCount - 1) +
        0.5;
      context.moveTo(x, 0);
      context.lineTo(x, maxY);
    }

    if (floatingRightColumnCount > 0) {
      const x =
        getOrThrow(visibleColumnXs, columnCount - floatingRightColumnCount) -
        0.5;
      context.moveTo(x, 0);
      context.lineTo(x, maxY);
    }

    context.stroke();
  }

  drawGridBackground(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    drawHover = false
  ): void {
    this.drawRowStripes(context, state);

    if (drawHover) {
      this.drawMouseColumnHover(context, state);

      this.drawMouseRowHover(context, state);
    }

    this.drawGridLines(context, state);

    this.drawCellBackgrounds(context, state);

    const { metrics } = state;
    const {
      bottom,
      right,
      floatingBottomRowCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
      floatingTopRowCount,
      columnCount,
      rowCount,
      visibleRowHeights,
      visibleRowYs,
      visibleColumnXs,
      visibleColumnWidths,
      width,
      height,
    } = metrics;
    this.drawSelectedRanges(context, state, {
      bottom: Math.min(bottom, rowCount - floatingBottomRowCount - 1),
      right: Math.min(right, columnCount - floatingRightColumnCount - 1),
      minX:
        floatingLeftColumnCount > 0 &&
        visibleColumnXs.has(floatingLeftColumnCount + 1)
          ? getOrThrow(visibleColumnXs, floatingLeftColumnCount + 1)
          : -10,
      minY:
        floatingTopRowCount > 0 && visibleRowYs.has(floatingTopRowCount + 1)
          ? getOrThrow(visibleRowYs, floatingTopRowCount + 1)
          : -10,
      maxX:
        floatingRightColumnCount > 0 &&
        visibleColumnXs.has(columnCount - floatingRightColumnCount - 1)
          ? getOrThrow(
              visibleColumnXs,
              columnCount - floatingRightColumnCount - 1
            ) +
            getOrThrow(
              visibleColumnWidths,
              columnCount - floatingRightColumnCount - 1
            ) -
            0.5
          : width + 10,
      maxY:
        floatingBottomRowCount > 0 &&
        visibleRowYs.has(rowCount - floatingBottomRowCount - 1)
          ? getOrThrow(visibleRowYs, rowCount - floatingBottomRowCount - 1) +
            getOrThrow(
              visibleRowHeights,
              rowCount - floatingBottomRowCount - 1
            ) -
            0.5
          : height + 10,
    });
  }

  drawRowStripes(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { metrics, theme } = state;
    const { visibleRows } = metrics;
    const { rowBackgroundColors } = theme;
    if (!rowBackgroundColors) {
      return;
    }
    this.drawRowStripesForRows(
      context,
      state,
      visibleRows,
      rowBackgroundColors
    );
  }

  drawRowStripesForRows(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    rows: VisibleIndex[],
    rowBackgroundColors: GridColorWay,
    minX = 0,
    maxX = state.metrics.maxX
  ): void {
    const { theme, metrics, model } = state;
    const { maxDepth, shadowBlur, shadowColor } = theme;

    const colorSets = this.getCachedBackgroundColors(
      rowBackgroundColors,
      maxDepth
    );
    const { visibleRowYs, visibleRowHeights } = metrics;

    // Optimize by grouping together all rows that end up with the same color
    const colorRowMap = new Map();
    const topShadowRows: VisibleIndex[] = []; // Rows that are deeper than the row above them
    const bottomShadowRows: VisibleIndex[] = [];
    const addRowToColorMap = (
      row: VisibleIndex,
      rowAbove?: VisibleIndex
    ): void => {
      const depth = isExpandableGridModel(model) ? model.depthForRow(row) : 0;
      const colorSet = colorSets[row % colorSets.length];
      const color = colorSet[Math.min(depth, colorSet.length - 1)];
      if (!colorRowMap.has(color)) {
        colorRowMap.set(color, []);
      }
      colorRowMap.get(color).push(row);
      if (rowAbove != null) {
        const depthAbove = isExpandableGridModel(model)
          ? model.depthForRow(rowAbove)
          : 0;
        if (depthAbove < depth) {
          topShadowRows.push(row);
        } else if (depthAbove > depth) {
          bottomShadowRows.push(rowAbove);
        }
      }
    };

    // Add all the regular row stripes
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowAbove = i > 0 ? rows[i - 1] : undefined;
      addRowToColorMap(row, rowAbove);
    }

    colorRowMap.forEach((colorRows, color) => {
      context.fillStyle = color;

      context.beginPath();

      for (let i = 0; i < colorRows.length; i += 1) {
        const row = colorRows[i];
        const y = getOrThrow(visibleRowYs, row);
        const rowHeight = getOrThrow(visibleRowHeights, row);
        context.rect(minX, y, maxX, rowHeight);
      }

      context.fill();
    });

    if (topShadowRows.length > 0) {
      context.save();

      const startColor = this.getCachedColorWithAlpha(shadowColor, 0.15);
      const endColor = this.getCachedColorWithAlpha(shadowColor, 0);
      const gradient = context.createLinearGradient(0, 0, 0, shadowBlur);
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);
      context.fillStyle = gradient;

      for (let i = 0; i < topShadowRows.length; i += 1) {
        const row = topShadowRows[i];
        const y = getOrThrow(visibleRowYs, row);
        // Use a translate so we can reuse the gradient
        context.translate(0, y);
        context.fillRect(minX, 0, maxX, shadowBlur);
        context.translate(0, -y);
      }

      context.restore();
    }

    if (bottomShadowRows.length > 0) {
      context.save();

      const startColor = this.getCachedColorWithAlpha(shadowColor, 0);
      const endColor = this.getCachedColorWithAlpha(shadowColor, 0.15);
      const gradient = context.createLinearGradient(0, 0, 0, shadowBlur);
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);
      context.fillStyle = gradient;

      for (let i = 0; i < bottomShadowRows.length; i += 1) {
        const row = bottomShadowRows[i];
        const y = getOrThrow(visibleRowYs, row);
        const rowHeight = getOrThrow(visibleRowHeights, row);
        const gradientY = y + rowHeight - shadowBlur;
        // Use a translate so we can reuse the gradient
        context.translate(0, gradientY);
        context.fillRect(minX, 0, maxX, shadowBlur);
        context.translate(0, -gradientY);
      }

      context.restore();
    }
  }

  drawMouseColumnHover(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { mouseX, mouseY, theme, metrics } = state;
    if (mouseX == null || mouseY == null) return;

    const mouseColumn = GridUtils.getColumnAtX(mouseX, metrics);
    if (mouseColumn == null || !theme.columnHoverBackgroundColor) {
      return;
    }

    const { visibleColumnWidths, visibleColumnXs, maxY } = metrics;
    if (mouseY > maxY) {
      return;
    }

    const x = getOrThrow(visibleColumnXs, mouseColumn);
    const columnWidth = getOrThrow(visibleColumnWidths, mouseColumn);

    context.fillStyle = theme.columnHoverBackgroundColor;
    context.fillRect(x, 0, columnWidth, maxY);
  }

  drawMouseRowHover(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { mouseX, mouseY, theme, metrics } = state;
    if (mouseX == null || mouseY == null) return;

    const { maxX } = metrics;
    if (mouseX > maxX || !theme.rowHoverBackgroundColor) {
      return;
    }

    const mouseRow = GridUtils.getRowAtY(mouseY, metrics);
    if (mouseRow == null) {
      return;
    }

    this.drawMouseRowHoverForRow(context, state, mouseRow);
  }

  drawFloatingMouseRowHover(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { mouseX, mouseY, theme, metrics } = state;
    const {
      maxX,
      floatingTopRowCount,
      floatingBottomRowCount,
      rowCount,
      rowFooterWidth,
    } = metrics;
    if (
      mouseX == null ||
      mouseY == null ||
      mouseX > maxX + rowFooterWidth ||
      !theme.rowHoverBackgroundColor
    ) {
      return;
    }

    const mouseRow = GridUtils.getRowAtY(mouseY, metrics);
    if (
      mouseRow != null &&
      (mouseRow < floatingTopRowCount ||
        rowCount - floatingBottomRowCount <= mouseRow)
    ) {
      this.drawMouseRowHoverForRow(context, state, mouseRow);
    }
  }

  drawMouseRowHoverForRow(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    row: VisibleIndex
  ): void {
    const { metrics, selectedRanges, theme } = state;
    const { visibleRowHeights, visibleRowYs, maxX } = metrics;

    const y = getOrThrow(visibleRowYs, row);
    const rowHeight = getOrThrow(visibleRowHeights, row);

    if (theme.rowHoverBackgroundColor) {
      context.fillStyle = theme.rowHoverBackgroundColor;
    }
    for (let i = 0; i < selectedRanges.length; i += 1) {
      const { startRow, endRow } = selectedRanges[i];
      if (
        startRow != null &&
        endRow != null &&
        startRow <= row &&
        endRow >= row
      ) {
        if (theme.selectedRowHoverBackgroundColor) {
          context.fillStyle = theme.selectedRowHoverBackgroundColor;
        }
        break;
      }
    }
    context.fillRect(0, y, maxX, rowHeight);
  }

  drawGridLines(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { metrics, theme } = state;
    const { visibleColumns, visibleRows } = metrics;

    this.drawGridLinesForItems(
      context,
      state,
      visibleColumns,
      visibleRows,
      theme.gridColumnColor,
      theme.gridRowColor
    );
  }

  drawGridLinesForItems(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    columns: VisibleIndex[],
    rows: VisibleIndex[],
    columnColor: NullableGridColor,
    rowColor: NullableGridColor
  ): void {
    if (!columnColor && !rowColor) {
      return;
    }

    context.lineWidth = 1;
    context.beginPath();

    if (columnColor) {
      context.strokeStyle = columnColor;
      this.drawGridLinesForColumns(context, state, columns);
    }
    if (rowColor) {
      context.strokeStyle = rowColor;
      this.drawGridLinesForRows(context, state, rows);
    }

    context.stroke();
  }

  drawGridLinesForColumns(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    columns: VisibleIndex[]
  ): void {
    const { metrics } = state;
    const { visibleColumnXs, maxY } = metrics;
    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i];
      const x = getOrThrow(visibleColumnXs, column) + 0.5;
      context.moveTo(x, 0);
      context.lineTo(x, maxY);
    }
  }

  drawGridLinesForRows(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    rows: VisibleIndex[]
  ): void {
    const { metrics } = state;
    const { visibleRowYs, maxX: metricsMaxX } = metrics;
    const maxX = metricsMaxX;

    // Draw row lines
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const y = getOrThrow(visibleRowYs, row) + 0.5;
      context.moveTo(0.5, y);
      context.lineTo(maxX - 0.5, y);
    }
  }

  drawCellBackgrounds(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { metrics } = state;
    const { visibleColumns, visibleRows } = metrics;
    this.drawCellBackgroundsForItems(
      context,
      state,
      visibleColumns,
      visibleRows
    );
  }

  drawCellBackgroundsForItems(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    columns: VisibleIndex[],
    rows: VisibleIndex[]
  ): void {
    context.save();

    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i];

      for (let j = 0; j < rows.length; j += 1) {
        const row = rows[j];
        const rowAfter = j + 1 < rows.length ? rows[j + 1] : undefined;
        this.drawCellBackground(context, state, column, row, rowAfter);
      }
    }

    context.restore();
  }

  drawCellBackground(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex,
    rowAfter?: VisibleIndex
  ): void {
    const { metrics, model, theme } = state;
    const {
      firstColumn,
      modelColumns,
      modelRows,
      visibleColumnXs,
      visibleColumnWidths,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);
    const backgroundColor = model.backgroundColorForCell(
      modelColumn,
      modelRow,
      theme
    );
    const isFirstColumn = column === firstColumn;
    const hasExpandableRows =
      isExpandableGridModel(model) && model.hasExpandableRows;

    if (backgroundColor) {
      const x = getOrThrow(visibleColumnXs, column) + 1;
      const y = getOrThrow(visibleRowYs, row) + 1;
      const columnWidth = getOrThrow(visibleColumnWidths, column) - 1;
      const rowHeight = getOrThrow(visibleRowHeights, row) - 1;
      context.fillStyle = backgroundColor;
      context.fillRect(x, y, columnWidth, rowHeight);
    }

    if (isFirstColumn && hasExpandableRows) {
      this.drawCellRowTreeDepthLines(context, state, row, rowAfter);
    }
  }

  drawCellContents(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { metrics } = state;
    const { visibleColumns } = metrics;

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      this.drawColumnCellContents(context, state, column);
    }
  }

  drawColumnCellContents(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex
  ): void {
    const { metrics } = state;
    const {
      visibleColumnXs,
      visibleColumnWidths,
      visibleRows,
      height,
    } = metrics;
    const x = getOrThrow(visibleColumnXs, column);
    const columnWidth = getOrThrow(visibleColumnWidths, column);

    context.save();

    context.beginPath();
    context.rect(x, 0, columnWidth, height);
    context.clip();

    for (let i = 0; i < visibleRows.length; i += 1) {
      const row = visibleRows[i];
      this.drawCellContent(context, state, column, row);
    }
    context.restore();
  }

  /**
   * Gets textWidth and X-Y position for a specific cell
   * The textWidth returned is the width that the text can occupy accounting for any other cell markings
   * The width accounts for tree table indents and cell padding, so it is the width the text may consume
   *
   * @param context Canvas context
   * @param state GridRenderState to get the text metrics for
   * @param column Column of cell to get text metrics for
   * @param row Row of cell to get text metrics for
   * @returns Object with width, x, and y of the text
   */
  getTextRenderMetrics(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): {
    width: number;
    x: number;
    y: number;
  } {
    const { textAlign } = context;
    const { metrics, model, theme } = state;
    const {
      firstColumn,
      visibleColumnXs,
      visibleColumnWidths,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;
    const {
      cellHorizontalPadding,
      treeDepthIndent,
      treeHorizontalPadding,
    } = theme;

    const x = getOrThrow(visibleColumnXs, column);
    const y = getOrThrow(visibleRowYs, row);
    const columnWidth = getOrThrow(visibleColumnWidths, column);
    const rowHeight = getOrThrow(visibleRowHeights, row);
    const isFirstColumn = column === firstColumn;
    let treeIndent = 0;
    if (
      isExpandableGridModel(model) &&
      model.hasExpandableRows &&
      isFirstColumn
    ) {
      treeIndent =
        treeDepthIndent * (model.depthForRow(row) + 1) + treeHorizontalPadding;
    }
    const textWidth = columnWidth - treeIndent;
    let textX = x + cellHorizontalPadding;
    const textY = y + rowHeight * 0.5;
    if (textAlign === 'right') {
      textX = x + textWidth - cellHorizontalPadding;
    } else if (textAlign === 'center') {
      textX = x + textWidth * 0.5;
    }
    textX += treeIndent;

    return {
      width: textWidth - cellHorizontalPadding * 2,
      x: textX,
      y: textY,
    };
  }

  drawCellContent(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex,
    textOverride?: string
  ): void {
    const { metrics, model, theme } = state;
    const {
      firstColumn,
      fontWidths,
      modelColumns,
      modelRows,
      visibleRowHeights,
    } = metrics;
    const { textColor } = theme;
    const rowHeight = getOrThrow(visibleRowHeights, row);
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);
    const text = textOverride ?? model.textForCell(modelColumn, modelRow);
    const truncationChar = model.truncationCharForCell(modelColumn, modelRow);
    const isFirstColumn = column === firstColumn;

    if (text && rowHeight > 0) {
      const textAlign = model.textAlignForCell(modelColumn, modelRow) || 'left';
      context.textAlign = textAlign;

      const color =
        model.colorForCell(modelColumn, modelRow, theme) || textColor;
      context.fillStyle = color;

      const {
        width: textWidth,
        x: textX,
        y: textY,
      } = this.getTextRenderMetrics(context, state, column, row);

      const fontWidth =
        fontWidths.get(context.font) ?? GridRenderer.DEFAULT_FONT_WIDTH;
      const truncatedText = this.getCachedTruncatedString(
        context,
        text,
        textWidth,
        fontWidth,
        truncationChar
      );
      if (truncatedText) {
        context.fillText(truncatedText, textX, textY);
      }
    }

    if (
      isFirstColumn &&
      isExpandableGridModel(model) &&
      model.hasExpandableRows
    ) {
      this.drawCellRowTreeMarker(context, state, row);
    }
  }

  drawCellRowTreeMarker(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    row: VisibleIndex
  ): void {
    const { metrics, model, mouseX, mouseY, theme } = state;
    const {
      firstColumn,
      gridX,
      gridY,
      visibleColumnXs,
      visibleColumnWidths,
      visibleRowYs,
      visibleRowHeights,
      visibleRowTreeBoxes,
    } = metrics;
    const { treeMarkerColor, treeMarkerHoverColor } = theme;
    const columnX = getOrThrow(visibleColumnXs, firstColumn);
    const columnWidth = getOrThrow(visibleColumnWidths, firstColumn);
    const rowY = getOrThrow(visibleRowYs, row);
    const rowHeight = getOrThrow(visibleRowHeights, row);
    if (!isExpandableGridModel(model) || !model.isRowExpandable(row)) {
      return;
    }

    const treeBox = getOrThrow(visibleRowTreeBoxes, row);
    const color =
      mouseX != null &&
      mouseY != null &&
      mouseX >= gridX + columnX &&
      mouseX <= gridX + columnX + columnWidth &&
      mouseY >= gridY + rowY &&
      mouseY <= gridY + rowY + rowHeight
        ? treeMarkerHoverColor
        : treeMarkerColor;

    this.drawTreeMarker(
      context,
      state,
      columnX,
      rowY,
      treeBox,
      color,
      model.isRowExpanded(row)
    );
  }

  drawTreeMarker(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    columnX: Coordinate,
    rowY: Coordinate,
    treeBox: BoxCoordinates,
    color: GridColor,
    isExpanded: boolean
  ): void {
    const { x1, y1, x2, y2 } = treeBox;
    const markerText = isExpanded ? '⊟' : '⊞';
    const textX = columnX + (x1 + x2) * 0.5 + 0.5;
    const textY = rowY + (y1 + y2) * 0.5 + 0.5;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.fillText(markerText, textX, textY);
  }

  drawCellRowTreeDepthLines(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    row: VisibleIndex,
    rowAfter?: VisibleIndex
  ): void {
    const { metrics, model, theme } = state;

    if (!isExpandableGridModel(model)) return;

    const depth = model.depthForRow(row);
    if (depth === 0) return;

    const {
      firstColumn,
      visibleColumnXs,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;
    const { treeDepthIndent, treeHorizontalPadding, treeLineColor } = theme;
    const columnX = getOrThrow(visibleColumnXs, firstColumn);
    const rowY = getOrThrow(visibleRowYs, row);
    const rowHeight = getOrThrow(visibleRowHeights, row);
    const depthRowAfter =
      rowAfter !== undefined ? model.depthForRow(rowAfter) : 0;
    const depthDiff = depth > depthRowAfter ? depth - depthRowAfter : 0;

    context.strokeStyle = treeLineColor;
    context.lineWidth = 1;

    // draw normal depth lines
    if (depth - depthDiff > 0) {
      context.beginPath();
      for (let i = 0; i < depth - depthDiff; i += 1) {
        const lineX =
          columnX +
          i * treeDepthIndent +
          treeDepthIndent * 0.5 +
          treeHorizontalPadding +
          0.5;
        context.moveTo(lineX, rowY);
        context.lineTo(lineX, rowY + rowHeight);
      }
      context.stroke();
    }

    // draw as hockey stick if last row at depth
    if (depthDiff > 0) {
      context.beginPath();
      for (let i = depth - depthDiff; i < depth; i += 1) {
        const lineX =
          columnX +
          i * treeDepthIndent +
          treeDepthIndent * 0.5 +
          treeHorizontalPadding +
          0.5;
        context.moveTo(lineX, rowY);
        context.lineTo(lineX, rowY + Math.ceil(rowHeight / 2));
        // extra moveTo prevents halfpixel in corner
        context.moveTo(lineX - 0.5, rowY + Math.ceil(rowHeight / 2) + 0.5);
        context.lineTo(
          lineX + treeDepthIndent - 0.5,
          rowY + Math.ceil(rowHeight / 2) + 0.5
        );
      }
      context.stroke();
    }
  }

  getCachedTruncatedString = memoizeClear(
    (
      context: CanvasRenderingContext2D,
      text: string,
      width: number,
      fontWidth: number,
      truncationChar?: string
    ): string =>
      GridRenderer.truncateToWidth(
        context,
        text,
        width,
        fontWidth,
        truncationChar
      ),
    { max: 10000 }
  );

  getCachedBackgroundColors = memoizeClear(
    (backgroundColors: GridColorWay, maxDepth: number): GridColor[][] =>
      backgroundColors.split(' ').map(color => {
        const colors = [];
        for (let i = 0; i < maxDepth; i += 1) {
          colors.push(GridColorUtils.darkenForDepth(color, i, maxDepth));
        }
        return colors;
      }),
    { max: 1000 }
  );

  getCachedColorWithAlpha = memoizeClear(
    (color, alpha) => GridColorUtils.colorWithAlpha(color, alpha),
    { max: 1000 }
  );

  drawHeaders(context: CanvasRenderingContext2D, state: GridRenderState): void {
    const { theme } = state;

    context.font = theme.headerFont;

    this.drawColumnHeaders(context, state);

    this.drawRowHeaders(context, state);
  }

  drawFooters(context: CanvasRenderingContext2D, state: GridRenderState): void {
    const { theme } = state;

    context.font = theme.headerFont;

    this.drawRowFooters(context, state);
  }

  drawColumnHeaders(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const {
      mouseX,
      mouseY,
      theme,
      metrics,
      draggingColumnSeparator,
      isDragging,
    } = state;
    const {
      columnHeaderHeight,
      floatingColumns,
      gridX,
      width,
      visibleColumns,
      visibleColumnWidths,
      visibleColumnXs,
      floatingLeftColumnCount,
    } = metrics;
    if (columnHeaderHeight <= 0) {
      return;
    }

    const {
      headerBackgroundColor,
      headerColor,
      headerHiddenSeparatorSize,
      headerHiddenSeparatorHoverColor,
      headerSeparatorColor,
      headerSeparatorHoverColor,
    } = theme;
    const hiddenSeparatorHeight = columnHeaderHeight * 0.5;
    const hiddenY = columnHeaderHeight * 0.5 - hiddenSeparatorHeight * 0.5;
    const containsFrozenColumns = floatingLeftColumnCount > 0;
    let floatingLeftColumnsWidth = 0;

    context.save();

    context.beginPath();

    // Fill in the background
    context.fillStyle = headerBackgroundColor;
    context.fillRect(0, 0, width, columnHeaderHeight);

    context.fillStyle = headerColor;

    // Visible columns.
    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = getOrThrow(visibleColumnWidths, column);
      const x = getOrThrow(visibleColumnXs, column) + gridX;
      this.drawColumnHeader(context, state, column, x, columnWidth);
    }

    if (containsFrozenColumns) {
      floatingLeftColumnsWidth =
        getOrThrow(visibleColumnXs, floatingLeftColumnCount - 1) +
        getOrThrow(visibleColumnWidths, floatingLeftColumnCount - 1);

      // Frozen columns' background
      context.fillStyle = headerBackgroundColor;
      context.fillRect(gridX, 0, floatingLeftColumnsWidth, columnHeaderHeight);

      // Frozen columns.
      context.fillStyle = headerColor;
      for (let i = 0; i < floatingColumns.length; i += 1) {
        const column = floatingColumns[i];
        const columnWidth = getOrThrow(visibleColumnWidths, column);
        const x = getOrThrow(visibleColumnXs, column) + gridX;
        this.drawColumnHeader(context, state, column, x, columnWidth);
      }
    }

    // Draw the separators, visible columns then floating columns.
    if (headerSeparatorColor) {
      context.strokeStyle = headerSeparatorColor;
      context.beginPath();
      const hiddenColumns = [];

      // Draw visible column separators.
      let isPreviousColumnHidden = false;
      for (let i = 0; i < visibleColumns.length; i += 1) {
        const column = visibleColumns[i];
        const columnX = getOrThrow(visibleColumnXs, column);
        const columnWidth = getOrThrow(visibleColumnWidths, column);

        if (!(columnX < floatingLeftColumnsWidth - columnWidth)) {
          if (columnWidth > 0) {
            const x = gridX + columnX + columnWidth + 0.5;
            context.moveTo(x, 0);
            context.lineTo(x, columnHeaderHeight - 0.5);
            isPreviousColumnHidden = false;
          } else if (!isPreviousColumnHidden) {
            isPreviousColumnHidden = true;
            hiddenColumns.push(column);
          }
        }
      }

      // Draw floating column separators.
      isPreviousColumnHidden = false;
      for (let i = 0; i < floatingColumns.length; i += 1) {
        const column = floatingColumns[i];
        const columnX = getOrThrow(visibleColumnXs, column);
        const columnWidth = getOrThrow(visibleColumnWidths, column);
        if (columnWidth > 0) {
          const x = gridX + columnX + columnWidth + 0.5;
          context.moveTo(x, 0);
          context.lineTo(x, columnHeaderHeight - 0.5);
          isPreviousColumnHidden = false;
        } else if (!isPreviousColumnHidden) {
          isPreviousColumnHidden = true;
          hiddenColumns.push(column);
        }
      }

      // Bottom Border, should be interior to the header height
      context.moveTo(0, columnHeaderHeight - 0.5);
      context.lineTo(width, columnHeaderHeight - 0.5);
      context.stroke();

      // Now draw the hidden column separator boxes
      context.beginPath();
      context.fillStyle = headerSeparatorColor;
      for (let i = 0; i < hiddenColumns.length; i += 1) {
        const column = hiddenColumns[i];
        const columnX = getOrThrow(visibleColumnXs, column);
        const columnWidth = getOrThrow(visibleColumnWidths, column);
        const minX =
          gridX + columnX + columnWidth + 0.5 - headerHiddenSeparatorSize * 0.5;
        context.rect(
          minX,
          hiddenY,
          headerHiddenSeparatorSize,
          hiddenSeparatorHeight
        );
      }
      context.fill();
    }

    if (headerSeparatorHoverColor) {
      let highlightedSeparator = draggingColumnSeparator;

      if (highlightedSeparator == null && mouseX != null && mouseY != null) {
        highlightedSeparator = GridUtils.getColumnSeparatorIndex(
          mouseX,
          mouseY,
          metrics,
          theme
        );
      }

      if (
        highlightedSeparator != null &&
        (!isDragging || draggingColumnSeparator != null)
      ) {
        context.strokeStyle = headerSeparatorHoverColor;

        const columnX = getOrThrow(visibleColumnXs, highlightedSeparator);
        const columnWidth = getOrThrow(
          visibleColumnWidths,
          highlightedSeparator
        );
        const x = gridX + columnX + columnWidth + 0.5;
        const visibleColumnIndex = visibleColumns.indexOf(highlightedSeparator);
        const nextColumn =
          visibleColumnIndex < visibleColumns.length - 1
            ? visibleColumns[visibleColumnIndex + 1]
            : null;
        const nextColumnWidth =
          nextColumn != null ? visibleColumnWidths.get(nextColumn) : null;
        const isColumnHidden = columnWidth === 0;
        const isNextColumnHidden =
          nextColumnWidth != null && nextColumnWidth === 0;
        if (isColumnHidden) {
          context.strokeStyle = headerHiddenSeparatorHoverColor;
          context.fillStyle = headerHiddenSeparatorHoverColor;
          context.fillRect(
            x,
            hiddenY,
            headerHiddenSeparatorSize * 0.5,
            hiddenSeparatorHeight
          );
        } else if (isNextColumnHidden) {
          context.fillStyle = headerSeparatorHoverColor;
          context.fillRect(
            x - headerHiddenSeparatorSize * 0.5,
            hiddenY,
            headerHiddenSeparatorSize * 0.5,
            hiddenSeparatorHeight
          );
        }

        // column seperator hover line
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, columnHeaderHeight - 1);
        context.stroke();
      }
    }

    context.restore();
  }

  drawColumnHeader(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    columnX: Coordinate,
    columnWidth: number
  ): void {
    if (columnWidth <= 0) {
      return;
    }
    const { metrics, model, theme } = state;
    const { modelColumns } = metrics;
    const modelColumn = getOrThrow(modelColumns, column);
    let text = model.textForColumnHeader(modelColumn);

    const { headerHorizontalPadding } = theme;
    const { columnHeaderHeight, fontWidths } = metrics;
    const fontWidth =
      fontWidths.get(context.font) || GridRenderer.DEFAULT_FONT_WIDTH;

    const maxLength = (columnWidth - headerHorizontalPadding * 2) / fontWidth;
    if (maxLength <= 0) {
      return;
    }

    context.save();

    context.beginPath();
    context.rect(columnX, 0, columnWidth, columnHeaderHeight);
    context.clip();

    if (text.length > maxLength) {
      text = `${text.substring(0, maxLength - 1)}…`;

      const x = columnX + headerHorizontalPadding;
      const y = columnHeaderHeight * 0.5;

      context.textAlign = 'left';
      context.fillText(text, x, y);
    } else {
      const x = columnX + columnWidth * 0.5;
      const y = columnHeaderHeight * 0.5;

      context.textAlign = 'center';
      context.fillText(text, x, y);
    }

    context.restore();
  }

  drawRowHeaders(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { mouseX, mouseY, metrics, theme, draggingRowSeparator } = state;
    const {
      gridY,
      rowHeaderWidth,
      height,
      visibleRows,
      visibleRowHeights,
      visibleRowYs,
    } = metrics;
    if (rowHeaderWidth <= 0) {
      return;
    }

    const {
      headerBackgroundColor,
      headerColor,
      headerHiddenSeparatorSize,
      headerHiddenSeparatorHoverColor,
      headerSeparatorColor,
      headerSeparatorHoverColor,
    } = theme;
    const hiddenSeparatorWidth = rowHeaderWidth * 0.5;
    const hiddenX = rowHeaderWidth * 0.5 - hiddenSeparatorWidth * 0.5;

    context.save();

    context.beginPath();

    // Fill in the background
    context.fillStyle = headerBackgroundColor;
    context.fillRect(0, 0, rowHeaderWidth, height);

    // Draw the separators
    if (headerSeparatorColor) {
      context.strokeStyle = headerSeparatorColor;
      context.beginPath();
      context.moveTo(0, gridY + 0.5);
      context.lineTo(rowHeaderWidth, gridY + 0.5);

      const hiddenRows = [];
      let isPreviousRowHidden = false;
      for (let i = 0; i < visibleRows.length; i += 1) {
        const row = visibleRows[i];
        const rowY = getOrThrow(visibleRowYs, row);
        const rowHeight = getOrThrow(visibleRowHeights, row);
        if (rowHeight > 0) {
          const y = gridY + rowY + rowHeight + 0.5;

          context.moveTo(0, y);
          context.lineTo(rowHeaderWidth, y);

          isPreviousRowHidden = false;
        } else if (!isPreviousRowHidden) {
          isPreviousRowHidden = true;
          hiddenRows.push(row);
        }
      }

      // border right, interior to the headerWidth
      context.moveTo(rowHeaderWidth - 0.5, 0);
      context.lineTo(rowHeaderWidth - 0.5, height);

      context.stroke();

      // Draw the hidden column separators
      context.beginPath();
      context.fillStyle = headerSeparatorColor;
      for (let i = 0; i < hiddenRows.length; i += 1) {
        const row = hiddenRows[i];
        const rowY = getOrThrow(visibleRowYs, row);
        const rowHeight = getOrThrow(visibleRowHeights, row);
        const minY =
          gridY + rowY + rowHeight + 0.5 - headerHiddenSeparatorSize * 0.5;
        context.rect(
          hiddenX,
          minY,
          hiddenSeparatorWidth,
          headerHiddenSeparatorSize
        );
      }

      context.fill();
    }

    if (headerSeparatorHoverColor) {
      let highlightedSeparator = draggingRowSeparator;
      if (highlightedSeparator == null && mouseX != null && mouseY != null) {
        highlightedSeparator = GridUtils.getRowSeparatorIndex(
          mouseX,
          mouseY,
          metrics,
          theme
        );
      }

      if (highlightedSeparator != null) {
        context.strokeStyle = headerSeparatorHoverColor;

        const rowY = getOrThrow(visibleRowYs, highlightedSeparator);
        const rowHeight = getOrThrow(visibleRowHeights, highlightedSeparator);
        const y = gridY + rowY + rowHeight + 0.5;

        const visibleRowIndex = visibleRows.indexOf(highlightedSeparator);
        const nextRow =
          visibleRowIndex < visibleRows.length - 1
            ? visibleRows[visibleRowIndex + 1]
            : null;
        const nextRowHeight =
          nextRow != null ? visibleRowHeights.get(nextRow) : null;
        const isRowHidden = rowHeight === 0;
        const isNextRowHidden = nextRowHeight != null && nextRowHeight === 0;
        if (isRowHidden) {
          context.strokeStyle = headerHiddenSeparatorHoverColor;
          context.fillStyle = headerHiddenSeparatorHoverColor;
          context.fillRect(
            hiddenX,
            y,
            hiddenSeparatorWidth,
            headerHiddenSeparatorSize * 0.5
          );
        } else if (isNextRowHidden) {
          context.fillStyle = headerSeparatorHoverColor;
          context.fillRect(
            hiddenX,
            y - headerHiddenSeparatorSize * 0.5,
            hiddenSeparatorWidth,
            headerHiddenSeparatorSize * 0.5
          );
        }

        context.beginPath();
        context.moveTo(0.5, y);
        context.lineTo(rowHeaderWidth + 0.5, y);
        context.stroke();
      }
    }

    // Fill in the text
    context.beginPath();
    context.rect(0, gridY, rowHeaderWidth, height);
    context.clip();

    context.fillStyle = headerColor;
    context.textAlign = 'right';

    for (let i = 0; i < visibleRows.length; i += 1) {
      const row = visibleRows[i];
      const rowHeight = getOrThrow(visibleRowHeights, row);
      const y = getOrThrow(visibleRowYs, row) + gridY;
      this.drawRowHeader(context, state, row, y, rowHeight);
    }

    context.restore();
  }

  drawRowHeader(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    row: VisibleIndex,
    rowY: Coordinate,
    rowHeight: number
  ): void {
    if (rowHeight <= 0) {
      return;
    }
    const { metrics, model, theme } = state;
    const { modelRows, rowHeaderWidth } = metrics;
    const modelRow = getOrThrow(modelRows, row);
    const x = rowHeaderWidth - theme.cellHorizontalPadding;
    const y = rowY + rowHeight * 0.5;
    context.fillText(model.textForRowHeader(modelRow), x, y);
  }

  drawRowFooters(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const {
      mouseX,
      mouseY,
      metrics,
      model,
      theme,
      draggingRowSeparator,
    } = state;
    const {
      gridY,
      gridX,
      maxX,
      modelRows,
      rowFooterWidth,
      height,
      verticalBarWidth,
      visibleRows,
      visibleRowHeights,
      visibleRowYs,
      width,
    } = metrics;
    if (rowFooterWidth <= 0) {
      return;
    }

    const {
      cellHorizontalPadding,
      headerBackgroundColor,
      headerColor,
      headerHiddenSeparatorSize,
      headerHiddenSeparatorHoverColor,
      headerSeparatorColor,
      headerSeparatorHoverColor,
    } = theme;
    const hiddenSeparatorWidth = rowFooterWidth * 0.5;
    const hiddenX = rowFooterWidth * 0.5 - hiddenSeparatorWidth * 0.5;
    const x = Math.min(gridX + maxX, width - rowFooterWidth - verticalBarWidth);

    context.save();

    context.beginPath();

    // Fill in the background
    context.fillStyle = headerBackgroundColor;
    context.fillRect(x, gridY, rowFooterWidth, height);

    // Draw the separators
    if (headerSeparatorColor) {
      context.strokeStyle = headerSeparatorColor;
      context.beginPath();
      context.moveTo(x, gridY + 0.5);
      context.lineTo(rowFooterWidth, gridY + 0.5);

      const hiddenRows = [];
      let isPreviousRowHidden = false;
      for (let i = 0; i < visibleRows.length; i += 1) {
        const row = visibleRows[i];
        const rowY = getOrThrow(visibleRowYs, row);
        const rowHeight = getOrThrow(visibleRowHeights, row);
        if (rowHeight > 0) {
          const y = gridY + rowY + rowHeight + 0.5;

          context.moveTo(x + 0.5, y);
          context.lineTo(x + rowFooterWidth - 0.5, y);

          isPreviousRowHidden = false;
        } else if (!isPreviousRowHidden) {
          isPreviousRowHidden = true;
          hiddenRows.push(row);
        }
      }

      // border left, interior to the headerWidth
      context.moveTo(x + 0.5, gridY);
      context.lineTo(x + 0.5, height);

      context.stroke();

      // Draw the hidden column separators
      context.beginPath();
      context.fillStyle = headerSeparatorColor;
      for (let i = 0; i < hiddenRows.length; i += 1) {
        const row = hiddenRows[i];
        const rowY = getOrThrow(visibleRowYs, row);
        const rowHeight = getOrThrow(visibleRowHeights, row);
        const minY =
          gridY + rowY + rowHeight + 0.5 - headerHiddenSeparatorSize * 0.5;
        context.rect(
          x + hiddenX,
          minY,
          hiddenSeparatorWidth,
          headerHiddenSeparatorSize
        );
      }

      context.fill();
    }

    if (headerSeparatorHoverColor) {
      let highlightedSeparator = draggingRowSeparator;
      if (highlightedSeparator == null && mouseX != null && mouseY != null) {
        highlightedSeparator = GridUtils.getRowSeparatorIndex(
          mouseX,
          mouseY,
          metrics,
          theme
        );
      }

      if (highlightedSeparator != null) {
        context.strokeStyle = headerSeparatorHoverColor;

        const rowY = getOrThrow(visibleRowYs, highlightedSeparator);
        const rowHeight = getOrThrow(visibleRowHeights, highlightedSeparator);
        const y = gridY + rowY + rowHeight + 0.5;

        const visibleRowIndex = visibleRows.indexOf(highlightedSeparator);
        const nextRow =
          visibleRowIndex < visibleRows.length - 1
            ? visibleRows[visibleRowIndex + 1]
            : null;
        const nextRowHeight =
          nextRow != null ? visibleRowHeights.get(nextRow) : null;
        const isRowHidden = rowHeight === 0;
        const isNextRowHidden = nextRowHeight != null && nextRowHeight === 0;
        if (isRowHidden) {
          context.strokeStyle = headerHiddenSeparatorHoverColor;
          context.fillStyle = headerHiddenSeparatorHoverColor;
          context.fillRect(
            hiddenX,
            y,
            hiddenSeparatorWidth,
            headerHiddenSeparatorSize * 0.5
          );
        } else if (isNextRowHidden) {
          context.fillStyle = headerSeparatorHoverColor;
          context.fillRect(
            hiddenX,
            y - headerHiddenSeparatorSize * 0.5,
            hiddenSeparatorWidth,
            headerHiddenSeparatorSize * 0.5
          );
        }

        context.beginPath();
        context.moveTo(x + 0.5, y);
        context.lineTo(x + rowFooterWidth + 0.5, y);
        context.stroke();
      }
    }

    // Fill in the text
    context.beginPath();
    context.rect(x, gridY, rowFooterWidth, height);
    context.clip();

    context.fillStyle = headerColor;
    context.textAlign = 'left';

    const textX = x + cellHorizontalPadding;
    for (let i = 0; i < visibleRows.length; i += 1) {
      const row = visibleRows[i];
      const rowHeight = getOrThrow(visibleRowHeights, row);
      if (rowHeight > 0) {
        const rowY = getOrThrow(visibleRowYs, row) + gridY;
        const modelRow = getOrThrow(modelRows, row);
        const textY = rowY + rowHeight * 0.5;
        context.fillText(model.textForRowFooter(modelRow), textX, textY);
      }
    }

    context.restore();
  }

  drawSelectedRanges(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    viewport: {
      left?: VisibleIndex;
      top?: VisibleIndex;
      right?: VisibleIndex;
      bottom?: VisibleIndex;
      minX?: Coordinate;
      minY?: Coordinate;
      maxX?: Coordinate;
      maxY?: Coordinate;
    } = {}
  ): void {
    const {
      cursorColumn: column,
      cursorRow: row,
      draggingRow,
      draggingColumn,
      editingCell,
      metrics,
      model,
      selectedRanges,
      theme,
    } = state;
    const {
      visibleColumnWidths,
      visibleColumnXs,
      visibleRowHeights,
      visibleRowYs,
      width,
      height,
    } = metrics;
    const {
      left = metrics.left,
      top = metrics.top,
      right = metrics.right,
      bottom = metrics.bottom,
      minY = -10,
      maxY = height + 10,
      minX = -10,
      maxX = width + 10,
    } = viewport;
    if (selectedRanges.length === 0) {
      return;
    }

    const isCursorVisible =
      isEditableGridModel(model) &&
      model.isEditable &&
      editingCell == null &&
      draggingRow == null &&
      draggingColumn == null &&
      column != null &&
      row != null &&
      visibleColumnXs.has(column) &&
      visibleRowYs.has(row);
    if (isCursorVisible) {
      // Punch a hole out where the active cell is, it gets styled differently.
      const x = getOrThrow(visibleColumnXs, column);
      const y = getOrThrow(visibleRowYs, row);
      const w = getOrThrow(visibleColumnWidths, column);
      const h = getOrThrow(visibleRowHeights, row);

      context.save();

      context.beginPath();

      context.rect(0, 0, width, height);
      context.rect(x, y, w, h);

      context.clip('evenodd');
    }

    // Draw selection ranges
    context.beginPath();
    for (let i = 0; i < selectedRanges.length; i += 1) {
      const selectedRange = selectedRanges[i];
      const startColumn =
        selectedRange.startColumn !== null ? selectedRange.startColumn : left;
      const startRow =
        selectedRange.startRow !== null ? selectedRange.startRow : top;
      const endColumn =
        selectedRange.endColumn !== null ? selectedRange.endColumn : right;
      const endRow =
        selectedRange.endRow !== null ? selectedRange.endRow : bottom;
      if (
        endRow >= top &&
        bottom >= startRow &&
        endColumn >= left &&
        right >= startColumn
      ) {
        // Need to offset the x/y coordinates so that the line draws nice and crisp
        const x =
          startColumn >= left && visibleColumnXs.has(startColumn)
            ? Math.round(getOrThrow(visibleColumnXs, startColumn)) + 0.5
            : minX;
        const y =
          startRow >= top && visibleRowYs.has(startRow)
            ? Math.max(
                Math.round(getOrThrow(visibleRowYs, startRow)) + 0.5,
                0.5
              )
            : minY;

        const endX =
          endColumn <= right && visibleColumnXs.has(endColumn)
            ? Math.round(
                getOrThrow(visibleColumnXs, endColumn) +
                  getOrThrow(visibleColumnWidths, endColumn)
              ) - 0.5
            : maxX;
        const endY =
          endRow <= bottom && visibleRowYs.has(endRow)
            ? Math.round(
                getOrThrow(visibleRowYs, endRow) +
                  getOrThrow(visibleRowHeights, endRow)
              ) - 0.5
            : maxY;

        context.rect(x, y, endX - x, endY - y);
      }

      // draw the inner transparent fill
      context.fillStyle = theme.selectionColor;
      context.fill();

      /**
       * draw an "inner stroke" that's clipped to just inside of the rects
       * to act as a casing to the outer stroke. 3px width because 1px is outside
       * the rect (but clipped), 1px is "on" the rect (technically this pixel is
       * a half pixel clip as well due to rects offset, but we are immediately painting
       * over it), and then the 1px inside (which is the desired pixel).
       */
      context.save();
      context.clip();
      context.strokeStyle = theme.selectionOutlineCasingColor;
      context.lineWidth = 3;
      context.stroke();
      context.restore();

      // draw the outerstroke border on top of the inner stroke
      context.strokeStyle = theme.selectionOutlineColor;
      context.lineWidth = 1;
      context.stroke();
    }

    if (isCursorVisible && column != null && row != null) {
      context.restore();

      this.drawActiveCell(context, state, column, row);
    }
  }

  drawActiveCell(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex,
    borderWidth = GridRenderer.ACTIVE_CELL_BORDER_WIDTH
  ): void {
    const { metrics, theme } = state;
    const {
      visibleColumnWidths,
      visibleColumnXs,
      visibleRowHeights,
      visibleRowYs,
    } = metrics;
    const cellX = getOrThrow(visibleColumnXs, column);
    const cellY = getOrThrow(visibleRowYs, row);
    const cellW = getOrThrow(visibleColumnWidths, column);
    const cellH = getOrThrow(visibleRowHeights, row);

    // Now get the outline for the active cell
    let x = cellX - borderWidth * 0.5;
    let y = cellY - borderWidth * 0.5;
    let w = cellW + borderWidth;
    let h = cellH + borderWidth;

    // Make sure the outline is interior on the edge
    if (x <= 0) {
      w += x - 1;
      x = 1;
    }
    if (y <= 0) {
      h += y - 1;
      y = 1;
    }

    const { lineWidth } = context;
    context.beginPath();
    context.lineWidth = borderWidth;
    context.strokeStyle = theme.selectionOutlineColor;
    this.drawRoundedRect(context, x, y, w, h);
    context.stroke();
    context.lineWidth = lineWidth;
  }

  /**
   * Draws a rounded rectangle using the current state of the canvas.
   *
   * @param context The canvas context
   * @param x coordinate of the left side
   * @param y coordinate of the top side
   * @param w width of the rectangle
   * @param h height of the rectangle
   * @param r corner radius of the rectangle
   */
  drawRoundedRect(
    context: CanvasRenderingContext2D,
    x: Coordinate,
    y: Coordinate,
    w: number,
    h: number,
    r = GridRenderer.DEFAULT_EDGE_RADIUS
  ): void {
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  drawDraggingColumn(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const {
      draggingColumn,
      draggingColumnOffset,
      metrics,
      mouseX,
      theme,
    } = state;
    if (draggingColumn == null || mouseX == null) {
      return;
    }

    const {
      gridX,
      gridY,
      visibleColumnXs,
      visibleColumnWidths,
      height,
    } = metrics;
    const x = getOrThrow(visibleColumnXs, draggingColumn);
    const columnWidth = getOrThrow(visibleColumnWidths, draggingColumn) + 1;
    const {
      backgroundColor,
      font,
      headerFont,
      reorderOffset,
      shadowBlur,
      shadowColor,
    } = theme;

    context.save();

    context.translate(gridX, 0);

    // First, we need to draw over the row stripes where the column is coming from
    context.fillStyle = backgroundColor;
    context.fillRect(x, 0, columnWidth, height);

    context.translate(
      mouseX - x - gridX - (draggingColumnOffset ?? 0),
      gridY + reorderOffset
    );

    // Then draw the shadow of the moving column
    context.save();

    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;

    context.fillStyle = backgroundColor;
    context.fillRect(x, -gridY, columnWidth, height);

    context.restore();

    // Now set the clipping region and pretty much just redraw this column and all it's contents
    context.beginPath();
    context.rect(x, -gridY, columnWidth, height);
    context.clip();

    context.font = font;

    this.drawGridBackground(context, state);

    this.drawColumnCellContents(context, state, draggingColumn);

    // Now translate it back up and draw the header
    context.translate(-gridX, -gridY);

    context.font = headerFont;

    this.drawColumnHeaders(context, state);

    context.restore();
  }

  drawDraggingRow(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { draggingRow, draggingRowOffset, metrics, mouseY, theme } = state;
    if (draggingRow == null || mouseY == null) {
      return;
    }

    const { gridX, gridY, visibleRowYs, visibleRowHeights, width } = metrics;
    const y = getOrThrow(visibleRowYs, draggingRow);
    const rowHeight = getOrThrow(visibleRowHeights, draggingRow) + 1;
    const {
      backgroundColor,
      font,
      headerFont,
      reorderOffset,
      shadowBlur,
      shadowColor,
    } = theme;

    context.save();

    context.translate(0, gridY);

    // First, we need to draw over the row stripes where the row is coming from
    context.fillStyle = backgroundColor;
    context.fillRect(0, y, width, rowHeight);

    context.translate(
      gridX + reorderOffset,
      mouseY - y - gridY - (draggingRowOffset ?? 0)
    );

    // Then draw the shadow of the moving row
    context.save();

    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;

    context.fillStyle = backgroundColor;
    context.fillRect(-gridX, y, width, rowHeight);

    context.restore();

    // Now set the clipping region and pretty much just redraw this row and all it's contents
    context.beginPath();
    context.rect(-gridX, y, width, rowHeight);
    context.clip();

    context.font = font;

    this.drawGridBackground(context, state);

    this.drawCellContents(context, state);

    // Now translate it back up and draw the header
    context.translate(-gridX, -gridY);

    context.font = headerFont;

    this.drawRowHeaders(context, state);

    context.restore();
  }

  drawScrollBars(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const {
      isDraggingHorizontalScrollBar,
      isDraggingVerticalScrollBar,
      isDragging,
      metrics,
      mouseX,
      mouseY,
      theme,
    } = state;
    if (theme.scrollBarSize <= 0) {
      return;
    }

    const {
      rowHeaderWidth,
      columnHeaderHeight,
      width,
      height,
      handleHeight,
      handleWidth,
      scrollX,
      scrollY,
      hasHorizontalBar,
      hasVerticalBar,
      barWidth,
      barHeight,
      visibleColumnXs,
    } = metrics;
    const {
      scrollBarBackgroundColor,
      scrollBarHoverBackgroundColor,
      scrollBarCasingColor,
      scrollBarCornerColor,
      scrollBarColor,
      scrollBarHoverColor,
      scrollBarActiveColor,
      scrollBarSize,
      scrollBarHoverSize,
      scrollBarCasingWidth,
      scrollBarSelectionTickColor,
      scrollBarActiveSelectionTickColor,
      autoSelectRow,
      autoSelectColumn,
    } = theme;

    //
    const isInbounds =
      mouseX != null && mouseY != null && mouseX <= width && mouseY <= height;

    const isVerticalBarHover =
      isDraggingVerticalScrollBar ||
      (hasVerticalBar &&
        !isDraggingHorizontalScrollBar &&
        !isDragging &&
        mouseX != null &&
        mouseY != null &&
        mouseX >= width - scrollBarHoverSize &&
        mouseY <= barHeight + columnHeaderHeight &&
        isInbounds);

    const isHorizontalBarHover =
      isDraggingHorizontalScrollBar ||
      (hasHorizontalBar &&
        !isDraggingVerticalScrollBar &&
        !isDragging &&
        !isVerticalBarHover && // vert bar gets priorty in overlapped corner hover area
        mouseX != null &&
        mouseY != null &&
        mouseY >= height - scrollBarHoverSize &&
        mouseX <= barWidth - rowHeaderWidth &&
        isInbounds);

    const hScrollBarSize = isHorizontalBarHover
      ? scrollBarHoverSize
      : scrollBarSize;
    const vScrollBarSize = isVerticalBarHover
      ? scrollBarHoverSize
      : scrollBarSize;

    context.translate(rowHeaderWidth, columnHeaderHeight);

    if (hasHorizontalBar && hasVerticalBar) {
      // That little corner in the bottom right
      context.fillStyle = scrollBarCasingColor;
      context.fillRect(
        width - rowHeaderWidth - scrollBarSize,
        height - columnHeaderHeight - scrollBarSize,
        scrollBarSize,
        scrollBarSize
      );
      context.fillStyle = scrollBarCornerColor;
      context.fillRect(
        width - rowHeaderWidth - scrollBarSize + scrollBarCasingWidth,
        height - columnHeaderHeight - scrollBarSize + scrollBarCasingWidth,
        scrollBarSize - scrollBarCasingWidth,
        scrollBarSize - scrollBarCasingWidth
      );
    }

    if (hasHorizontalBar) {
      const x = scrollX;
      const y = height - columnHeaderHeight - hScrollBarSize;

      // scrollbar casing
      context.fillStyle = scrollBarCasingColor;
      context.fillRect(0, y, barWidth, hScrollBarSize - scrollBarCasingWidth);

      // scrollbar track
      context.fillStyle = isHorizontalBarHover
        ? scrollBarHoverBackgroundColor
        : scrollBarBackgroundColor;
      context.fillRect(
        0,
        y + scrollBarCasingWidth,
        barWidth,
        hScrollBarSize - scrollBarCasingWidth
      );

      // scrollbar thumb
      if (isDraggingHorizontalScrollBar) {
        context.fillStyle = scrollBarActiveColor;
      } else if (isHorizontalBarHover) {
        context.fillStyle = scrollBarHoverColor;
      } else {
        context.fillStyle = scrollBarColor;
      }

      context.fillRect(
        x,
        y + scrollBarCasingWidth,
        handleWidth,
        hScrollBarSize - scrollBarCasingWidth
      );

      if (!autoSelectRow && scrollBarSelectionTickColor != null) {
        context.fillStyle = scrollBarSelectionTickColor;
        // Scrollbar Selection Tick
        const { selectedRanges, model, cursorColumn } = state;
        const { visibleColumns, visibleColumnWidths } = metrics;
        const { columnCount } = model;

        const leftVisibleIndex = Math.min(...visibleColumns.values());
        const rightVisibleIndex = Math.max(...visibleColumns.values());

        const getTickX = (index: number) => {
          if (index < leftVisibleIndex) {
            return Math.round((index / columnCount) * barWidth);
          }
          if (index > rightVisibleIndex) {
            const remainderRight =
              (getOrThrow(visibleColumnXs, rightVisibleIndex) +
                getOrThrow(visibleColumnWidths, rightVisibleIndex) -
                barWidth) /
              getOrThrow(visibleColumnWidths, rightVisibleIndex);

            const rightTickSize =
              (barWidth - (x + handleWidth)) /
              (columnCount - rightVisibleIndex + remainderRight);

            return Math.round(
              barWidth - (columnCount - index + 1) * rightTickSize
            );
          }
          return Math.round(
            (getOrThrow(visibleColumnXs, index) / width) * handleWidth + x
          );
        };

        const filteredRanges = [...selectedRanges].filter(
          value => value.startColumn != null && value.endColumn != null
        ) as NoneNullColumnRange[];

        filteredRanges.sort(GridRenderer.compareColumns);

        const mergedRanges: NoneNullColumnRange[] = [];

        for (let i = 0; i < filteredRanges.length; i += 1) {
          const range = filteredRanges[i];
          const { startColumn, endColumn } = range;
          if (i === 0) {
            mergedRanges.push({ startColumn, endColumn });
          } else if (
            startColumn - 1 <=
            mergedRanges[mergedRanges.length - 1].endColumn
          ) {
            mergedRanges[mergedRanges.length - 1].endColumn = Math.max(
              mergedRanges[mergedRanges.length - 1].endColumn,
              endColumn
            );
          } else {
            mergedRanges.push({ startColumn, endColumn });
          }
        }

        for (let i = 0; i < mergedRanges.length; i += 1) {
          const range = mergedRanges[i];
          if (
            range.startColumn != null &&
            range.endColumn != null &&
            (range.startColumn !== cursorColumn ||
              range.endColumn !== cursorColumn)
          ) {
            const tickX = Math.round(
              (range.startColumn / columnCount) * barWidth
            );
            const tickWidth = Math.max(
              1,
              Math.round(
                ((range.endColumn + 1) / columnCount) * barWidth - tickX
              )
            );
            const trackHeight = hScrollBarSize - scrollBarCasingWidth;
            context.fillRect(
              tickX,
              y + scrollBarCasingWidth + Math.round(trackHeight / 3),
              tickWidth,
              Math.round(trackHeight / 3)
            );
          }
        }

        // Current Active Tick
        if (cursorColumn != null) {
          // const tickX = Math.round((cursorColumn / columnCount) * barWidth);
          const tickX = getTickX(cursorColumn);
          const tickWidth = 2;
          const trackHeight = hScrollBarSize - scrollBarCasingWidth;
          context.fillStyle = scrollBarActiveSelectionTickColor;
          context.fillRect(
            tickX,
            y + scrollBarCasingWidth,
            tickWidth,
            trackHeight
          );
        }
      }
    }

    if (hasVerticalBar) {
      const x = width - rowHeaderWidth - vScrollBarSize;
      const y = scrollY;

      // scrollbar casing
      context.fillStyle = scrollBarCasingColor;
      context.fillRect(x, 0, vScrollBarSize - scrollBarCasingWidth, barHeight);

      // scrollbar track
      context.fillStyle = isVerticalBarHover
        ? scrollBarHoverBackgroundColor
        : scrollBarBackgroundColor;
      context.fillRect(
        x + scrollBarCasingWidth,
        0,
        vScrollBarSize - scrollBarCasingWidth,
        barHeight
      );

      // scrollbar thumb
      if (isDraggingVerticalScrollBar) {
        context.fillStyle = scrollBarActiveColor;
      } else if (isVerticalBarHover) {
        context.fillStyle = scrollBarHoverColor;
      } else {
        context.fillStyle = scrollBarColor;
      }

      context.fillRect(
        x + scrollBarCasingWidth,
        y,
        vScrollBarSize - scrollBarCasingWidth,
        handleHeight
      );

      if (!autoSelectColumn && scrollBarSelectionTickColor != null) {
        // Scrollbar Selection Tick
        const { selectedRanges, model, cursorRow } = state;
        const { rowCount } = model;

        context.fillStyle = scrollBarSelectionTickColor;

        const filteredRanges = [...selectedRanges].filter(
          value => value.startRow != null && value.endRow != null
        ) as NoneNullRowRange[];

        filteredRanges.sort(GridRenderer.compareRows);

        const mergedRanges: NoneNullRowRange[] = [];

        for (let i = 0; i < filteredRanges.length; i += 1) {
          const range = filteredRanges[i];
          const { startRow, endRow } = range;
          if (i === 0) {
            mergedRanges.push({ startRow, endRow });
          } else if (
            startRow - 1 <=
            mergedRanges[mergedRanges.length - 1].endRow
          ) {
            mergedRanges[mergedRanges.length - 1].endRow = Math.max(
              mergedRanges[mergedRanges.length - 1].endRow,
              endRow
            );
          } else {
            mergedRanges.push({ startRow, endRow });
          }
        }

        for (let i = 0; i < mergedRanges.length; i += 1) {
          const range = mergedRanges[i];
          if (
            range.startRow != null &&
            range.endRow != null &&
            (range.startRow !== cursorRow || range.endRow !== cursorRow)
          ) {
            const tickY = Math.round((range.startRow / rowCount) * barHeight);
            const trackWidth = vScrollBarSize - scrollBarCasingWidth;
            const tickHeight = Math.max(
              1,
              Math.round(
                ((range.endRow - range.startRow + 1) / rowCount) * barHeight
              )
            );
            context.fillRect(
              x + scrollBarCasingWidth + Math.round(trackWidth / 3),
              tickY,
              Math.round(trackWidth / 3),
              tickHeight
            );
          }
        }

        // Current Active Tick
        if (cursorRow != null) {
          const tickY = Math.round((cursorRow / rowCount) * barHeight);

          const trackWidth = vScrollBarSize - scrollBarCasingWidth;
          const tickHeight = 2;

          context.fillStyle = scrollBarActiveSelectionTickColor;
          context.fillRect(
            x + scrollBarCasingWidth,
            tickY,
            trackWidth,
            tickHeight
          );
        }
      }
    }

    context.translate(-rowHeaderWidth, -columnHeaderHeight);
  }
}

export default GridRenderer;
