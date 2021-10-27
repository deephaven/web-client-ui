import memoizeClear from './memoizeClear';
import GridUtils from './GridUtils';
import GridColorUtils from './GridColorUtils';

/* eslint react/destructuring-assignment: "off" */
/* eslint class-methods-use-this: "off" */
/* eslint no-param-reassign: "off" */
/**
 * A GridRenderer handles rendering the different parts of the grid
 * This default rendering just renders a basic grid. Extend this class and implement
 * your own methods to customize drawing of the grid (eg. Draw icons or special features)
 */
class GridRenderer {
  static DEFAULT_FONT_WIDTH = 10;

  static DEFAULT_EDGE_RADIUS = 2;

  static ACTIVE_CELL_BORDER_WIDTH = 2;

  /**
   * Truncate a string and add ellipses if necessary
   * @param {string} str The string to truncate
   * @param {number} len The length to truncate the string to. If longer than the actual string, just returns the string
   */
  static truncate(str, len) {
    if (len < str.length) {
      // eslint-disable-next-line prefer-template
      return str.substr(0, len) + '…';
    }
    return str;
  }

  /**
   * Uses binary search to truncate a string to fit in the provided width
   * @param {Context} context The drawing context to measure the text in
   * @param {string} str The string to get the maximum length it can draw
   * @param {number} width The width to truncate it to
   * @param {number} start The low boundary to start the search
   * @param {number} end The high boundary to start the search
   */
  static binaryTruncateToWidth(
    context,
    str,
    width,
    start = 0,
    end = str.length
  ) {
    if (end >= str.length && context.measureText(str).width <= width) {
      // IDS-6069 If the whole string can fit, don't bother checking for truncation
      // The ellipses are actually slightly wider than other chars, and it's possible
      // that the "truncation" ends up being slightly longer, which messes up the search
      // algorithm below.
      // Besides, if we already fit, it's just faster to not bother checking other truncations.
      return str;
    }
    let lo = start;
    let hi = Math.min(str.length - 1, end);
    let result = str;
    while (hi > lo) {
      const mid = Math.ceil((hi + lo) / 2);
      const truncatedStr = GridRenderer.truncate(str, mid);
      if (context.measureText(truncatedStr).width <= width) {
        result = truncatedStr;
        if (lo === mid) {
          break;
        }
        lo = mid;
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
   * @param {Context} context The drawing context
   * @param {string} str The string to calculate max length for
   * @param {number} width The width to truncate within
   * @param {number} fontWidth The estimated width of each character
   */
  static truncateToWidth(
    context,
    str,
    width,
    fontWidth = GridRenderer.DEFAULT_FONT_WIDTH
  ) {
    if (width <= 0 || str.length <= 0) {
      return null;
    }

    const lo = Math.min(Math.floor(width / fontWidth / 2), str.length);
    const hi = Math.min(Math.ceil((width / fontWidth) * 2), str.length);

    return GridRenderer.binaryTruncateToWidth(context, str, width, lo, hi);
  }

  /**
   *
   * @param {CanvasRenderingContext2D} context The context to draw the grid in
   * @param {GridState} state State of the grid, { left, top, mouseX, mouseY, selectedRanges, theme, model, metrics }
   */
  drawCanvas(state) {
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

  configureContext(context, state) {
    const { theme } = state;
    context.font = theme.font;
    context.textBaseline = 'middle';
    context.lineCap = 'butt';
  }

  drawBackground(context, state) {
    const { theme, metrics } = state;
    const { width, height } = metrics;
    context.fillStyle = theme.backgroundColor;
    context.fillRect(0, 0, width, height);
  }

  drawGrid(context, state) {
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

  drawFloatingRows(context, state) {
    const { metrics, theme } = state;
    const {
      draggingRow,
      draggingColumn,
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
      this.drawSelectedRanges(
        context,
        state,
        {
          top: 0,
          bottom: floatingTopRowCount - 1,
          maxY:
            visibleRowYs.get(floatingTopRowCount - 1) +
            visibleRowHeights.get(floatingTopRowCount - 1) -
            0.5,
        },
        true
      );
    }
    if (floatingBottomRowCount > 0) {
      this.drawSelectedRanges(
        context,
        state,
        {
          top: rowCount - floatingBottomRowCount - 1,
          bottom: rowCount - 1,
          minY: visibleRowYs.get(rowCount - floatingBottomRowCount) + 0.5,
          maxY:
            visibleRowYs.get(rowCount - 1) +
            visibleRowHeights.get(rowCount - 1) -
            0.5,
        },
        true
      );
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

  drawFloatingColumns(context, state) {
    const { metrics, theme } = state;
    const {
      draggingRow,
      draggingColumn,
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

    this.drawGridLinesForItems(
      context,
      state,
      floatingColumns,
      visibleRows,
      theme.floatingGridColumnColor,
      theme.floatingGridRowColor
    );

    this.drawCellBackgroundsForItems(
      context,
      state,
      floatingColumns,
      visibleRows
    );

    this.drawFloatingBorders(context, state);

    // Draw the floating column selection...
    if (floatingLeftColumnCount > 0) {
      this.drawSelectedRanges(
        context,
        state,
        {
          left: 0,
          maxX:
            visibleColumnXs.get(floatingLeftColumnCount - 1) +
            visibleColumnWidths.get(floatingLeftColumnCount - 1),
        },
        true
      );
    }
    if (floatingRightColumnCount > 0) {
      this.drawSelectedRanges(
        context,
        state,
        {
          left: columnCount - floatingRightColumnCount,
          right: columnCount - 1,
          minX:
            visibleColumnXs.get(columnCount - floatingRightColumnCount) + 0.5,
          maxX:
            visibleColumnXs.get(columnCount - 1) +
            visibleColumnWidths.get(columnCount - 1),
        },
        true
      );
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

  drawFloatingBorders(context, state) {
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
        visibleRowYs.get(floatingTopRowCount - 1) +
        visibleRowHeights.get(floatingTopRowCount - 1) +
        0.5;
      context.moveTo(0.5, y);
      context.lineTo(maxX - 0.5, y);
    }

    if (floatingBottomRowCount > 0) {
      const y = visibleRowYs.get(rowCount - floatingBottomRowCount) - 0.5;
      context.moveTo(0.5, y);
      context.lineTo(maxX - 0.5, y);
    }

    if (floatingLeftColumnCount > 0) {
      const x =
        visibleColumnXs.get(floatingLeftColumnCount - 1) +
        visibleColumnWidths.get(floatingLeftColumnCount - 1) +
        0.5;
      context.moveTo(x, 0.5);
      context.lineTo(x, maxY - 0.5);
    }

    if (floatingRightColumnCount > 0) {
      const x =
        visibleColumnXs.get(columnCount - floatingRightColumnCount) - 0.5;
      context.moveTo(x, 0.5);
      context.lineTo(x, maxY - 0.5);
    }

    context.stroke();

    context.beginPath();
    context.lineWidth = 1;
    context.strokeStyle = floatingDividerInnerColor;

    if (floatingTopRowCount > 0) {
      const y =
        visibleRowYs.get(floatingTopRowCount - 1) +
        visibleRowHeights.get(floatingTopRowCount - 1) +
        0.5;
      context.moveTo(0.5, y);
      context.lineTo(maxX - 0.5, y);
    }

    if (floatingBottomRowCount > 0) {
      const y = visibleRowYs.get(rowCount - floatingBottomRowCount) - 0.5;
      context.moveTo(0.5, y);
      context.lineTo(maxX - 0.5, y);
    }

    if (floatingLeftColumnCount > 0) {
      const x =
        visibleColumnXs.get(floatingLeftColumnCount - 1) +
        visibleColumnWidths.get(floatingLeftColumnCount - 1) +
        0.5;
      context.moveTo(x, 0.5);
      context.lineTo(x, maxY - 0.5);
    }

    if (floatingRightColumnCount > 0) {
      const x =
        visibleColumnXs.get(columnCount - floatingRightColumnCount) - 0.5;
      context.moveTo(x, 0.5);
      context.lineTo(x, maxY - 0.5);
    }

    context.stroke();
  }

  drawGridBackground(context, state, drawHover = false) {
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
      floatingTopColumnCount,
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
          ? visibleColumnXs.get(floatingLeftColumnCount + 1)
          : -10,
      minY:
        floatingTopColumnCount > 0 &&
        visibleRowYs.has(floatingTopColumnCount + 1)
          ? visibleRowYs.get(floatingTopColumnCount + 1)
          : -10,
      maxX:
        floatingRightColumnCount > 0 &&
        visibleColumnXs.has(columnCount - floatingRightColumnCount - 1)
          ? visibleColumnXs.get(columnCount - floatingRightColumnCount - 1) +
            visibleColumnWidths.get(
              columnCount - floatingRightColumnCount - 1
            ) -
            0.5
          : width + 10,
      maxY:
        floatingBottomRowCount > 0 &&
        visibleRowYs.has(rowCount - floatingBottomRowCount - 1)
          ? visibleRowYs.get(rowCount - floatingBottomRowCount - 1) +
            visibleRowHeights.get(rowCount - floatingBottomRowCount - 1) -
            0.5
          : height + 10,
    });
  }

  drawRowStripes(context, state) {
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
    context,
    state,
    rows,
    rowBackgroundColors,
    minX = 0,
    maxX = state.metrics.maxX
  ) {
    const { theme, metrics, model } = state;
    const { maxDepth, shadowBlur, shadowColor } = theme;

    const colorSets = this.getCachedBackgroundColors(
      rowBackgroundColors,
      maxDepth
    );
    const { visibleRowYs, visibleRowHeights } = metrics;

    // Optimize by grouping together all rows that end up with the same color
    const colorRowMap = new Map();
    const topShadowRows = []; // Rows that are deeper than the row above them
    const bottomShadowRows = [];
    const addRowToColorMap = (row, rowAbove) => {
      const depth = model.depthForRow(row);
      const colorSet = colorSets[row % colorSets.length];
      const color = colorSet[Math.min(depth, colorSet.length - 1)];
      if (!colorRowMap.has(color)) {
        colorRowMap.set(color, []);
      }
      colorRowMap.get(color).push(row);
      if (rowAbove != null) {
        const depthAbove = model.depthForRow(rowAbove);
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
      const rowAbove = i > 0 ? rows[i - 1] : null;
      addRowToColorMap(row, rowAbove);
    }

    colorRowMap.forEach((colorRows, color) => {
      context.fillStyle = color;

      context.beginPath();

      for (let i = 0; i < colorRows.length; i += 1) {
        const row = colorRows[i];
        const y = visibleRowYs.get(row);
        const rowHeight = visibleRowHeights.get(row);
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
        const y = visibleRowYs.get(row);
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
        const y = visibleRowYs.get(row);
        const rowHeight = visibleRowHeights.get(row);
        const gradientY = y + rowHeight - shadowBlur;
        // Use a translate so we can reuse the gradient
        context.translate(0, gradientY);
        context.fillRect(minX, 0, maxX, shadowBlur);
        context.translate(0, -gradientY);
      }

      context.restore();
    }
  }

  drawMouseColumnHover(context, state) {
    const { mouseX, mouseY, theme, metrics } = state;
    const mouseColumn = GridUtils.getColumnAtX(mouseX, metrics);
    if (mouseColumn == null || !theme.columnHoverBackgroundColor) {
      return;
    }

    const { visibleColumnWidths, visibleColumnXs, maxY } = metrics;
    if (mouseY > maxY) {
      return;
    }

    const x = visibleColumnXs.get(mouseColumn);
    const columnWidth = visibleColumnWidths.get(mouseColumn);

    context.fillStyle = theme.columnHoverBackgroundColor;
    context.fillRect(x, 0, columnWidth, maxY);
  }

  drawMouseRowHover(context, state) {
    const { mouseX, mouseY, theme, metrics } = state;
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

  drawFloatingMouseRowHover(context, state) {
    const { mouseX, mouseY, theme, metrics } = state;
    const {
      maxX,
      floatingTopRowCount,
      floatingBottomRowCount,
      rowCount,
      rowFooterWidth,
    } = metrics;
    if (mouseX > maxX + rowFooterWidth || !theme.rowHoverBackgroundColor) {
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

  drawMouseRowHoverForRow(context, state, row) {
    const { metrics, selectedRanges, theme } = state;
    const { visibleRowHeights, visibleRowYs, maxX } = metrics;

    const y = visibleRowYs.get(row);
    const rowHeight = visibleRowHeights.get(row);

    context.fillStyle = theme.rowHoverBackgroundColor;
    for (let i = 0; i < selectedRanges.length; i += 1) {
      if (
        selectedRanges[i].startRow <= row &&
        selectedRanges[i].endRow >= row
      ) {
        context.fillStyle = theme.selectedRowHoverBackgroundColor;
        break;
      }
    }
    context.fillRect(0, y, maxX, rowHeight);
  }

  drawGridLines(context, state) {
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

  drawGridLinesForItems(context, state, columns, rows, columnColor, rowColor) {
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

  drawGridLinesForColumns(context, state, columns) {
    const { metrics } = state;
    const { visibleColumnXs, maxY } = metrics;
    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i];
      const x = visibleColumnXs.get(column) + 0.5;
      context.moveTo(x, 0);
      context.lineTo(x, maxY);
    }
  }

  drawGridLinesForRows(context, state, rows) {
    const { metrics } = state;
    const {
      visibleRowYs,
      maxX: metricsMaxX,
      floatingLeftColumnCount,
      visibleColumnXs,
      visibleColumnWidths,
    } = metrics;
    let maxX = metricsMaxX;

    if (floatingLeftColumnCount) {
      maxX =
        visibleColumnXs.get(floatingLeftColumnCount - 1) +
        visibleColumnWidths.get(floatingLeftColumnCount - 1);
    }

    // Draw row lines
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const y = visibleRowYs.get(row) + 0.5;
      context.moveTo(0.5, y);
      context.lineTo(maxX - 0.5, y);
    }
  }

  drawCellBackgrounds(context, state) {
    const { metrics } = state;
    const { visibleColumns, visibleRows } = metrics;
    this.drawCellBackgroundsForItems(
      context,
      state,
      visibleColumns,
      visibleRows
    );
  }

  drawCellBackgroundsForItems(context, state, columns, rows) {
    context.save();

    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i];

      for (let j = 0; j < rows.length; j += 1) {
        const row = rows[j];
        const rowAfter = j + 1 < rows.length ? rows[j + 1] : null;
        this.drawCellBackground(context, state, column, row, rowAfter);
      }
    }

    context.restore();
  }

  drawCellBackground(context, state, column, row, rowAfter) {
    const {
      metrics,
      model,
      model: { hasExpandableRows },
      theme,
    } = state;
    const {
      firstColumn,
      modelColumns,
      modelRows,
      visibleColumnXs,
      visibleColumnWidths,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;
    const modelRow = modelRows.get(row);
    const modelColumn = modelColumns.get(column);
    const backgroundColor = model.backgroundColorForCell(
      modelColumn,
      modelRow,
      theme
    );
    const isFirstColumn = column === firstColumn;

    if (backgroundColor) {
      const x = visibleColumnXs.get(column) + 1;
      const y = visibleRowYs.get(row) + 1;
      const columnWidth = visibleColumnWidths.get(column) - 1;
      const rowHeight = visibleRowHeights.get(row) - 1;
      context.fillStyle = backgroundColor;
      context.fillRect(x, y, columnWidth, rowHeight);
    }

    if (isFirstColumn && hasExpandableRows) {
      this.drawCellRowTreeDepthLines(context, state, row, rowAfter);
    }
  }

  drawCellContents(context, state) {
    const { metrics } = state;
    const { visibleColumns } = metrics;

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      this.drawColumnCellContents(context, state, column);
    }
  }

  drawColumnCellContents(context, state, column) {
    const { metrics } = state;
    const {
      visibleColumnXs,
      visibleColumnWidths,
      visibleRows,
      height,
    } = metrics;
    const x = visibleColumnXs.get(column);
    const columnWidth = visibleColumnWidths.get(column);

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

  drawCellContent(context, state, column, row) {
    const {
      metrics,
      model,
      model: { hasExpandableRows },
      theme,
    } = state;
    const {
      firstColumn,
      fontWidths,
      modelColumns,
      modelRows,
      visibleColumnXs,
      visibleColumnWidths,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;
    const {
      cellHorizontalPadding,
      treeDepthIndent,
      treeHorizontalPadding,
      textColor,
    } = theme;
    const x = visibleColumnXs.get(column);
    const y = visibleRowYs.get(row);
    const columnWidth = visibleColumnWidths.get(column);
    const rowHeight = visibleRowHeights.get(row);
    const modelRow = modelRows.get(row);
    const modelColumn = modelColumns.get(column);
    const text = model.textForCell(modelColumn, modelRow);
    const isFirstColumn = column === firstColumn;

    if (text && rowHeight > 0) {
      const textAlign = model.textAlignForCell(modelColumn, modelRow) || 'left';
      context.textAlign = textAlign;

      const color =
        model.colorForCell(modelColumn, modelRow, theme) || textColor;
      context.fillStyle = color;

      let treeIndent = 0;
      if (hasExpandableRows && isFirstColumn) {
        treeIndent =
          treeDepthIndent * (model.depthForRow(row) + 1) +
          treeHorizontalPadding;
      }
      const textWidth = columnWidth - treeIndent;
      let textX = x + cellHorizontalPadding;
      const textY = y + rowHeight * 0.5;
      if (textAlign === 'right') {
        textX = x + textWidth - cellHorizontalPadding;
      } else if (textAlign === 'center') {
        textX = x + textWidth * 0.5;
      } else {
        textX = x + cellHorizontalPadding;
      }
      textX += treeIndent;

      const fontWidth = fontWidths.get(context.font);
      const truncatedText = this.getCachedTruncatedString(
        context,
        text,
        textWidth - cellHorizontalPadding * 2,
        fontWidth
      );
      if (truncatedText != null) {
        context.fillText(truncatedText, textX, textY);
      }
    }

    if (isFirstColumn && hasExpandableRows) {
      this.drawCellRowTreeMarker(context, state, row);
    }
  }

  drawCellRowTreeMarker(context, state, row) {
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
    const columnX = visibleColumnXs.get(firstColumn);
    const columnWidth = visibleColumnWidths.get(firstColumn);
    const rowY = visibleRowYs.get(row);
    const rowHeight = visibleRowHeights.get(row);
    const isExpandable = model.isRowExpandable(row);
    const isExpanded = model.isRowExpanded(row);

    if (isExpandable) {
      const treeBox = visibleRowTreeBoxes.get(row);
      const color =
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
        isExpanded
      );
    }
  }

  drawTreeMarker(context, state, columnX, rowY, treeBox, color, isExpanded) {
    const [x1, y1, x2, y2] = treeBox;
    const markerText = isExpanded ? '⊟' : '⊞';
    const textX = columnX + (x1 + x2) * 0.5 + 0.5;
    const textY = rowY + (y1 + y2) * 0.5 + 0.5;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.fillText(markerText, textX, textY);
  }

  drawCellRowTreeDepthLines(context, state, row, rowAfter) {
    const { metrics, model, theme } = state;

    const depth = model.depthForRow(row);
    if (depth === 0) return;

    const {
      firstColumn,
      visibleColumnXs,
      visibleRowYs,
      visibleRowHeights,
    } = metrics;
    const { treeDepthIndent, treeHorizontalPadding, treeLineColor } = theme;
    const columnX = visibleColumnXs.get(firstColumn);
    const rowY = visibleRowYs.get(row);
    const rowHeight = visibleRowHeights.get(row);
    const depthRowAfter = model.depthForRow(rowAfter);
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
    (context, text, width, fontWidth) =>
      GridRenderer.truncateToWidth(context, text, width, fontWidth),
    { max: 10000 }
  );

  getCachedBackgroundColors = memoizeClear(
    (backgroundColors, maxDepth) =>
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

  drawHeaders(context, state) {
    const { theme } = state;

    context.font = theme.headerFont;

    this.drawColumnHeaders(context, state);

    this.drawRowHeaders(context, state);
  }

  drawFooters(context, state) {
    const { theme } = state;

    context.font = theme.headerFont;

    this.drawRowFooters(context, state);
  }

  drawColumnHeaders(context, state) {
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

    context.save();

    context.beginPath();

    // Fill in the background
    context.fillStyle = headerBackgroundColor;
    context.fillRect(0, 0, width, columnHeaderHeight);

    context.fillStyle = headerColor;

    // Visible columns.
    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = visibleColumnWidths.get(column);
      const x = visibleColumnXs.get(column) + gridX;
      this.drawColumnHeader(context, state, column, x, columnWidth);
    }

    const frozenColumnsWidth =
      visibleColumnXs.get(floatingLeftColumnCount - 1) +
      visibleColumnWidths.get(floatingLeftColumnCount - 1);

    // Frozen columns' background
    context.fillStyle = headerBackgroundColor;
    context.fillRect(0, 0, frozenColumnsWidth, columnHeaderHeight);

    // Frozen columns.
    context.fillStyle = headerColor;
    for (let i = 0; i < floatingColumns.length; i += 1) {
      const column = floatingColumns[i];
      const columnWidth = visibleColumnWidths.get(column);
      const x = visibleColumnXs.get(column) + gridX;
      this.drawColumnHeader(context, state, column, x, columnWidth);
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
        const columnX = visibleColumnXs.get(column);
        const columnWidth = visibleColumnWidths.get(column);

        if (!(columnX < frozenColumnsWidth - columnWidth)) {
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
        const columnX = visibleColumnXs.get(column);
        const columnWidth = visibleColumnWidths.get(column);
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
        const columnX = visibleColumnXs.get(column);
        const columnWidth = visibleColumnWidths.get(column);
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

      if (highlightedSeparator == null) {
        highlightedSeparator = GridUtils.getColumnSeparatorIndex(
          mouseX,
          mouseY,
          metrics,
          theme,
          frozenColumnsWidth
        );
      }

      if (
        highlightedSeparator != null &&
        (!isDragging || draggingColumnSeparator != null)
      ) {
        context.strokeStyle = headerSeparatorHoverColor;

        const columnX = visibleColumnXs.get(highlightedSeparator);
        const columnWidth = visibleColumnWidths.get(highlightedSeparator);
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

  drawColumnHeader(context, state, column, columnX, columnWidth) {
    if (columnWidth <= 0) {
      return;
    }
    const { metrics, model, theme } = state;
    const { modelColumns } = metrics;
    const modelColumn = modelColumns.get(column);
    if (modelColumn === undefined) {
      return;
    }
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

  drawRowHeaders(context, state) {
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
        const rowY = visibleRowYs.get(row);
        const rowHeight = visibleRowHeights.get(row);
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
        const rowY = visibleRowYs.get(row);
        const rowHeight = visibleRowHeights.get(row);
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
      if (highlightedSeparator == null) {
        highlightedSeparator = GridUtils.getRowSeparatorIndex(
          mouseX,
          mouseY,
          metrics,
          theme
        );
      }

      if (highlightedSeparator != null) {
        context.strokeStyle = headerSeparatorHoverColor;

        const rowY = visibleRowYs.get(highlightedSeparator);
        const rowHeight = visibleRowHeights.get(highlightedSeparator);
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
      const rowHeight = visibleRowHeights.get(row);
      const y = visibleRowYs.get(row) + gridY;
      this.drawRowHeader(context, state, row, y, rowHeight);
    }

    context.restore();
  }

  drawRowHeader(context, state, row, rowY, rowHeight) {
    if (rowHeight <= 0) {
      return;
    }
    const { metrics, model, theme } = state;
    const { modelRows, rowHeaderWidth } = metrics;
    const modelRow = modelRows.get(row);
    const x = rowHeaderWidth - theme.cellHorizontalPadding;
    const y = rowY + rowHeight * 0.5;
    context.fillText(model.textForRowHeader(modelRow), x, y);
  }

  drawRowFooters(context, state) {
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
        const rowY = visibleRowYs.get(row);
        const rowHeight = visibleRowHeights.get(row);
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
        const rowY = visibleRowYs.get(row);
        const rowHeight = visibleRowHeights.get(row);
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
      if (highlightedSeparator == null) {
        highlightedSeparator = GridUtils.getRowSeparatorIndex(
          mouseX,
          mouseY,
          metrics,
          theme
        );
      }

      if (highlightedSeparator != null) {
        context.strokeStyle = headerSeparatorHoverColor;

        const rowY = visibleRowYs.get(highlightedSeparator);
        const rowHeight = visibleRowHeights.get(highlightedSeparator);
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
      const rowHeight = visibleRowHeights.get(row);
      if (rowHeight > 0) {
        const rowY = visibleRowYs.get(row) + gridY;
        const modelRow = modelRows.get(row);
        const textY = rowY + rowHeight * 0.5;
        context.fillText(model.textForRowFooter(modelRow), textX, textY);
      }
    }

    context.restore();
  }

  drawSelectedRanges(context, state, viewport = {}) {
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
      model.isEditable &&
      editingCell == null &&
      draggingRow == null &&
      draggingColumn == null &&
      visibleColumnXs.has(column) &&
      visibleRowYs.has(row);
    if (isCursorVisible) {
      // Punch a hole out where the active cell is, it gets styled differently.
      const x = visibleColumnXs.get(column);
      const y = visibleRowYs.get(row);
      const w = visibleColumnWidths.get(column);
      const h = visibleRowHeights.get(row);

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
            ? Math.round(visibleColumnXs.get(startColumn)) + 0.5
            : minX;
        const y =
          startRow >= top && visibleRowYs.has(startRow)
            ? Math.max(Math.round(visibleRowYs.get(startRow)) + 0.5, 0.5)
            : minY;

        const endX =
          endColumn <= right && visibleColumnXs.has(endColumn)
            ? Math.round(
                visibleColumnXs.get(endColumn) +
                  visibleColumnWidths.get(endColumn)
              ) - 0.5
            : maxX;
        const endY =
          endRow <= bottom && visibleRowYs.has(endRow)
            ? Math.round(
                visibleRowYs.get(endRow) + visibleRowHeights.get(endRow)
              ) - 0.5
            : maxY;

        context.rect(x, y, endX - x, endY - y);
      }

      // draw the inner transparent fill
      context.fillStyle = theme.selectionColor;
      context.fill();

      /*
      draw an "inner stroke" that's clipped to just inside of the rects
      to act as a casing to the outer stroke. 3px width because 1px is outside
      the rect (but clipped), 1px is "on" the rect (technically this pixel is
      a half pixel clip as well due to rects offset, but we are immediately painting
      over it), and then the 1px inside (which is the desired pixel).
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

    if (isCursorVisible) {
      context.restore();

      this.drawActiveCell(context, state, column, row);
    }
  }

  drawActiveCell(
    context,
    state,
    column,
    row,
    borderWidth = GridRenderer.ACTIVE_CELL_BORDER_WIDTH
  ) {
    const { metrics, theme } = state;
    const {
      visibleColumnWidths,
      visibleColumnXs,
      visibleRowHeights,
      visibleRowYs,
    } = metrics;
    const cellX = visibleColumnXs.get(column);
    const cellY = visibleRowYs.get(row);
    const cellW = visibleColumnWidths.get(column);
    const cellH = visibleRowHeights.get(row);

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
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x coordinate of the left side
   * @param {number} y coordinate of the top side
   * @param {number} w width of the rectangle
   * @param {number} h height of the rectangle
   * @param {number} r corner radius of the rectangle
   */
  drawRoundedRect(context, x, y, w, h, r = GridRenderer.DEFAULT_EDGE_RADIUS) {
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

  drawDraggingColumn(context, state) {
    const {
      draggingColumn,
      draggingColumnOffset,
      metrics,
      mouseX,
      theme,
    } = state;
    if (draggingColumn == null) {
      return;
    }

    const {
      gridX,
      gridY,
      visibleColumnXs,
      visibleColumnWidths,
      height,
    } = metrics;
    const x = visibleColumnXs.get(draggingColumn);
    const columnWidth = visibleColumnWidths.get(draggingColumn) + 1;
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
      mouseX - x - gridX - draggingColumnOffset,
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

  drawDraggingRow(context, state) {
    const { draggingRow, draggingRowOffset, metrics, mouseY, theme } = state;
    if (draggingRow == null) {
      return;
    }

    const { gridX, gridY, visibleRowYs, visibleRowHeights, width } = metrics;
    const y = visibleRowYs.get(draggingRow);
    const rowHeight = visibleRowHeights.get(draggingRow) + 1;
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
      mouseY - y - gridY - draggingRowOffset
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

  drawScrollBars(context, state) {
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
    } = theme;

    const isInbounds = mouseX <= width && mouseY <= height;

    const isVerticalBarHover =
      isDraggingVerticalScrollBar ||
      (hasVerticalBar &&
        !isDraggingHorizontalScrollBar &&
        !isDragging &&
        mouseX >= width - scrollBarHoverSize &&
        mouseY <= barHeight + columnHeaderHeight &&
        isInbounds);

    const isHorizontalBarHover =
      isDraggingHorizontalScrollBar ||
      (hasHorizontalBar &&
        !isDraggingVerticalScrollBar &&
        !isDragging &&
        !isVerticalBarHover && // vert bar gets priorty in overlapped corner hover area
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
    }

    context.translate(-rowHeaderWidth, -columnHeaderHeight);
  }
}

export default GridRenderer;
