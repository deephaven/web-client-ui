/* eslint class-methods-use-this: "off" */
import {
  type BoundedAxisRange,
  type Coordinate,
  type GridMetrics,
  GridRenderer,
  type GridRenderState,
  type GridThemeType,
  GridUtils,
  type VisibleIndex,
} from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { assertNotNull, getOrThrow } from '@deephaven/utils';
import {
  type AdvancedFilter,
  type QuickFilter,
  type IrisGridStateOverride,
} from './CommonTypes';
import { type IrisGridThemeType } from './IrisGridTheme';
import IrisGridTextCellRenderer from './IrisGridTextCellRenderer';
import IrisGridDataBarCellRenderer from './IrisGridDataBarCellRenderer';
import { getIcon } from './IrisGridIcons';

const ICON_NAMES = Object.freeze({
  SORT_UP: 'sortUp',
  SORT_DOWN: 'sortDown',
  CARET_DOWN: 'caretDown',
  CARET_RIGHT: 'caretRight',
  CELL_OVERFLOW: 'cellOverflow',
});

const EXPAND_ICON_SIZE = 10;

export type IrisGridRenderState = GridRenderState & IrisGridStateOverride;
/**
 * Handles rendering some of the Iris specific features, such as sorting icons, sort bar display
 * */
export class IrisGridRenderer extends GridRenderer {
  static isFilterValid(
    advancedFilter: AdvancedFilter | undefined | null,
    quickFilter: QuickFilter | undefined | null
  ): boolean {
    const isAdvancedFilterValid =
      advancedFilter == null || advancedFilter.filter != null;
    const isQuickFilterValid =
      quickFilter == null || quickFilter.filter != null;
    return isAdvancedFilterValid && isQuickFilterValid;
  }

  protected textCellRenderer = new IrisGridTextCellRenderer();

  protected dataBarCellRenderer = new IrisGridDataBarCellRenderer();

  getSortIcon(sort: dh.Sort | null, size: number): Path2D | null {
    if (!sort) {
      return null;
    }
    if (sort.direction === TableUtils.sortDirection.ascending) {
      return getIcon(ICON_NAMES.SORT_UP, size);
    }
    if (sort.direction === TableUtils.sortDirection.descending) {
      return getIcon(ICON_NAMES.SORT_DOWN, size);
    }
    return null;
  }

  drawCanvas(state: IrisGridRenderState): void {
    super.drawCanvas(state);

    this.drawScrim(state);
  }

  drawGrid(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    super.drawGrid(context, state);
    this.drawCellOverflowButton(state);
  }

  drawGridLines(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    super.drawGridLines(context, state);

    this.drawGroupedColumnLine(context, state);

    this.drawPendingRowLine(context, state);
  }

  drawCellContent(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): void {
    const { metrics, model } = state;
    const { modelColumns, modelRows } = metrics;
    const modelColumn = modelColumns.get(column);
    const modelRow = getOrThrow(modelRows, row);
    if (modelColumn === undefined) {
      return;
    }

    const renderType = model.renderTypeForCell(modelColumn, modelRow);
    const cellRenderer = this.getCellRenderer(renderType);
    cellRenderer.drawCellContent(context, state, column, row);
  }

  getCellOverflowButtonPosition({
    mouseX,
    mouseY,
    metrics,
    theme,
  }: {
    mouseX: Coordinate | null;
    mouseY: Coordinate | null;
    metrics: GridMetrics | undefined;
    theme: IrisGridThemeType;
  }): {
    left: Coordinate | null;
    top: Coordinate | null;
    width: number | null;
    height: number | null;
  } {
    return this.textCellRenderer.getCellOverflowButtonPosition(
      mouseX,
      mouseY,
      metrics,
      theme
    );
  }

  shouldRenderOverflowButton(state: IrisGridRenderState): boolean {
    return this.textCellRenderer.shouldRenderOverflowButton(state);
  }

  drawCellOverflowButton(state: IrisGridRenderState): void {
    const { context, mouseX, mouseY, theme } = state;
    if (mouseX == null || mouseY == null) return;

    if (!this.shouldRenderOverflowButton(state)) {
      return;
    }

    const {
      left: buttonLeft,
      top: buttonTop,
      width: buttonWidth,
      height: buttonHeight,
    } = this.getCellOverflowButtonPosition(state);

    const {
      cellHorizontalPadding,
      overflowButtonColor,
      overflowButtonHoverColor,
      iconSize,
    } = theme;

    context.save();
    if (
      overflowButtonHoverColor != null &&
      buttonLeft != null &&
      buttonWidth != null &&
      buttonTop != null &&
      buttonHeight != null &&
      mouseX >= buttonLeft &&
      mouseX <= buttonLeft + buttonWidth &&
      mouseY >= buttonTop &&
      mouseY <= buttonTop + buttonHeight
    ) {
      context.fillStyle = overflowButtonHoverColor;
    } else if (overflowButtonColor != null) {
      context.fillStyle = overflowButtonColor;
    }
    const icon = getIcon(ICON_NAMES.CELL_OVERFLOW, iconSize);
    if (buttonLeft != null && buttonTop != null && buttonHeight != null) {
      context.translate(
        buttonLeft + cellHorizontalPadding,
        buttonTop + (buttonHeight - iconSize) / 2
      );
    }
    context.fill(icon);

    context.restore();
  }

  drawGroupedColumnLine(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, model, theme } = state;
    const { groupedColumns } = model;
    const { maxY, allColumnWidths, allColumnXs } = metrics;
    if (
      groupedColumns.length === 0 ||
      theme.groupedColumnDividerColor == null
    ) {
      return;
    }

    // This assumes that the engine puts the grouped columns at the start of the
    // model, so model and visible index match for grouped columns. If we ever
    // add freeze support for tree tables or allow moving the grouped columns,
    // this assumption may no longer hold true. If such a change occurs, we'll
    // need to revisit this since a single vertical divider may no longer make
    // sense.
    const lastVisibleGroupColumnIndex = groupedColumns.length - 1;

    const columnX = allColumnXs.get(lastVisibleGroupColumnIndex);
    const columnWidth = allColumnWidths.get(lastVisibleGroupColumnIndex);
    if (columnX == null || columnWidth == null) {
      return;
    }

    const x = columnX + columnWidth + 0.5;

    context.strokeStyle = theme.groupedColumnDividerColor;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, maxY);
    context.stroke();
  }

  drawPendingRowLine(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, model, theme } = state;
    const { allRowYs, maxX } = metrics;
    const { pendingRowCount } = model;
    if (pendingRowCount <= 0) {
      return;
    }

    const firstPendingRow =
      model.rowCount - model.pendingRowCount - model.floatingBottomRowCount;
    let y = allRowYs.get(firstPendingRow);
    if (y == null) {
      return;
    }

    y -= 0.5;
    context.save();
    context.setLineDash([4, 2]);
    context.strokeStyle = theme.pendingTextColor;

    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(maxX, y);
    context.stroke();
    context.restore();
  }

  drawMouseColumnHover(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { theme, metrics, hoverSelectColumn } = state;
    if (
      hoverSelectColumn == null ||
      theme.linkerColumnHoverBackgroundColor == null
    ) {
      return;
    }

    const { allColumnWidths, allColumnXs, maxY } = metrics;

    const x = getOrThrow(allColumnXs, hoverSelectColumn);
    const columnWidth = getOrThrow(allColumnWidths, hoverSelectColumn);

    context.fillStyle = theme.linkerColumnHoverBackgroundColor;
    context.fillRect(x, 0, columnWidth, maxY);
  }

  drawMouseRowHover(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { isSelectingColumn } = state;
    if (!isSelectingColumn) {
      super.drawMouseRowHover(context, state);
    }
  }

  drawScrim(state: IrisGridRenderState): void {
    const { context, loadingScrimProgress, metrics, theme } = state;
    if (loadingScrimProgress == null) {
      return;
    }

    const { width, height, gridY } = metrics;
    const { scrimBlurSize, scrimColor } = theme;

    context.save();

    // Use global composite so we can change the underlying layer to grayscale
    context.globalCompositeOperation = 'color';
    context.filter = `blur(${scrimBlurSize}px)`;
    if (scrimColor != null) {
      context.fillStyle = scrimColor;
    }

    // Clip the path so the top edge is hard edge, bottom edge is soft/blurry
    context.beginPath();
    context.rect(0, gridY, width, height - gridY);
    context.clip();

    // Extend the edges beyond the clip area so they're hard edges
    context.fillRect(
      -scrimBlurSize,
      -scrimBlurSize + gridY,
      scrimBlurSize * 2 + width,
      (scrimBlurSize * 2 + (height - gridY)) * loadingScrimProgress
    );

    // add an overlay of the scrim color to darken things a bit
    context.globalCompositeOperation = 'source-over';
    context.filter = `blur(${scrimBlurSize}px) opacity(15%)`;
    context.fillRect(
      -scrimBlurSize,
      -scrimBlurSize + gridY,
      scrimBlurSize * 2 + width,
      (scrimBlurSize * 2 + (height - gridY)) * loadingScrimProgress
    );

    context.restore();
  }

  drawColumnHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    super.drawColumnHeaders(context, state);

    const { theme, metrics, model, reverse } = state;
    const { columnHeaderHeight } = metrics;

    this.drawFilterHeaders(context, state);

    if (columnHeaderHeight <= 0) {
      return;
    }

    const { sort } = model;
    // if there is only one sort bar, it is interior to the header to save space
    if (sort.length === 1) {
      let color;
      if (reverse) {
        color = theme.headerReverseBarColor;
      } else {
        color = theme.headerSortBarColor;
      }
      this.drawHeaderBar(
        context,
        state,
        color,
        reverse ? theme.reverseHeaderBarHeight : theme.sortHeaderBarHeight
      );
    } else if (sort.length > 1) {
      // if there's multiple bars, the sort is interior to header
      // and the reverse claims space in the table
      if (reverse) {
        this.drawHeaderBar(
          context,
          state,
          theme.headerReverseBarColor,
          theme.reverseHeaderBarHeight,
          false
        );
      }
      this.drawHeaderBar(
        context,
        state,
        theme.headerSortBarColor,
        theme.sortHeaderBarHeight
      );
    }
  }

  drawHeaderBar(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    color: string | CanvasGradient | CanvasPattern,
    barHeight: number,
    interior = true
  ): void {
    const { theme, metrics, model } = state;
    const { columnHeaderHeight, width } = metrics;
    // Draw casing with 1 pixel above and below the bar,
    // 1px falls on the existing split between grid/headers
    // so don't need to be accounnted for in math elsewhere
    let offset = 0;
    if (!interior) {
      offset = barHeight;
    }
    context.fillStyle = theme.headerBarCasingColor;
    context.fillRect(
      0,
      model.columnHeaderMaxDepth * columnHeaderHeight - barHeight - 2 + offset,
      width,
      barHeight + 2
    );

    context.fillStyle = color;
    context.fillRect(
      0,
      model.columnHeaderMaxDepth * columnHeaderHeight - barHeight - 1 + offset,
      width,
      barHeight
    );
  }

  drawColumnHeadersAtDepth(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    range: BoundedAxisRange,
    boundsProp: { minX: number; maxX: number },
    depth: number
  ): void {
    const { metrics, model, isMenuShown, theme } = state;
    const { columnHeaderMaxDepth } = model;
    const { width } = metrics;
    const { columnHeaderHeight } = theme;
    const bounds = {
      ...boundsProp,
      maxX:
        depth === columnHeaderMaxDepth - 1 && boundsProp.maxX === width
          ? width - (isMenuShown ? 0 : columnHeaderHeight) // Account for the menu button
          : boundsProp.maxX,
    };
    super.drawColumnHeadersAtDepth(context, state, range, bounds, depth);
  }

  drawColumnHeaderAtIndex(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    index: VisibleIndex,
    bounds: { minX: number; maxX: number }
  ): void {
    super.drawColumnHeaderAtIndex(context, state, index, bounds);
    const { metrics, model, theme } = state;
    const {
      modelColumns,
      allColumnWidths,
      allColumnXs,
      gridX,
      columnHeaderHeight,
    } = metrics;

    const { headerHorizontalPadding, iconSize: themeIconSize } = theme;
    const iconSize = Math.round(themeIconSize * 0.75); // The vsTriangle icons are a bit bigger than we want
    const columnWidth = getOrThrow(allColumnWidths, index, 0);
    const columnX = getOrThrow(allColumnXs, index) + gridX;
    const modelColumn = modelColumns.get(index);

    if (modelColumn == null) {
      return;
    }

    const columnName = model.columns[modelColumn]?.name;

    if (columnName == null) {
      return;
    }

    const sort = TableUtils.getSortForColumn(model.sort, columnName);

    if (!sort) {
      return;
    }

    const icon = this.getSortIcon(sort, iconSize);
    if (!icon) {
      return;
    }

    const text = model.textForColumnHeader(modelColumn);
    if (text === undefined) {
      return;
    }

    const textWidth = this.getCachedHeaderWidth(context, text);
    const textRight = gridX + columnX + textWidth + headerHorizontalPadding;
    let { maxX } = bounds;
    maxX -= headerHorizontalPadding; // Right visible edge of the headers
    // Right edge of the column. The icon has its own horizontal padding
    const defaultX = gridX + columnX + columnWidth - iconSize;

    // If the text is partially off the screen, put the icon to the right of the text
    // else put it at the right edge of the column/grid (whichever is smaller)
    const x = textRight > maxX ? textRight + 1 : Math.min(maxX, defaultX);
    const y = (columnHeaderHeight - iconSize) * 0.5;

    context.save();

    context.beginPath();
    context.rect(columnX, 0, columnWidth, columnHeaderHeight);
    context.clip();

    context.fillStyle = theme.headerSortBarColor;
    context.translate(x, y);
    context.fill(icon);

    context.restore();
  }

  drawFilterHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { isFilterBarShown, quickFilters, advancedFilters } = state;

    if (isFilterBarShown) {
      this.drawExpandedFilterHeaders(context, state);
    } else if (
      (quickFilters != null && quickFilters.size > 0) ||
      (advancedFilters != null && advancedFilters.size > 0)
    ) {
      this.drawCollapsedFilterHeaders(context, state);
    }
  }

  drawExpandedFilterHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, model, theme, quickFilters, advancedFilters } = state;
    const { filterBarHeight } = theme;

    if (filterBarHeight <= 0) {
      return;
    }

    const {
      gridX,
      gridY,
      maxX,
      modelColumns,
      visibleColumns,
      allColumnWidths,
      allColumnXs,
    } = metrics;

    const columnHeaderHeight = gridY - filterBarHeight;

    context.save();

    context.font = theme.filterBarFont;
    context.textAlign = 'left';

    if (
      (quickFilters != null && quickFilters.size > 0) ||
      (advancedFilters != null && advancedFilters.size > 0)
    ) {
      // fill style if a fiter is set on any column
      context.fillStyle = theme.filterBarExpandedActiveBackgroundColor;
    } else {
      // fill style with no filters set
      context.fillStyle = theme.filterBarExpandedBackgroundColor;
    }

    // Draw the background
    context.fillRect(gridX, columnHeaderHeight, maxX, filterBarHeight - 1);

    // Draw the bottom border
    context.fillStyle = theme.headerBarCasingColor;

    context.fillRect(gridX, columnHeaderHeight + filterBarHeight - 1, maxX, 1);

    // Draw the filter input boxes
    const y1 = columnHeaderHeight;
    context.strokeStyle = theme.filterBarSeparatorColor;
    context.beginPath();

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const modelColumn = getOrThrow(modelColumns, column);
      const columnX = getOrThrow(allColumnXs, column);
      const columnWidth = getOrThrow(allColumnWidths, column);
      if (model.isFilterable(modelColumn) && columnWidth > 0) {
        const x1 = gridX + (columnX ?? 0);
        context.rect(x1 + 0.5, y1 + 0.5, columnWidth, filterBarHeight - 2); // 1 for the border, 1 for the casing
      }
    }
    context.stroke();

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = getOrThrow(allColumnWidths, column);
      const columnX = getOrThrow(allColumnXs, column);
      const x = columnX + gridX;
      this.drawExpandedFilterHeader(context, state, column, x, columnWidth);
    }

    context.restore();
  }

  drawExpandedFilterHeader(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    column: VisibleIndex,
    columnX: Coordinate,
    columnWidth: number
  ): void {
    if (columnWidth <= 0) {
      return;
    }

    const { metrics, theme, quickFilters, advancedFilters } = state;
    const { modelColumns, gridY } = metrics;
    const {
      filterBarHeight,
      filterBarExpandedActiveCellBackgroundColor,
      filterBarErrorColor,
      filterBarHorizontalPadding,
      headerColor,
    } = theme;
    const columnHeaderHeight = gridY - filterBarHeight;
    const modelColumn = modelColumns.get(column);
    if (modelColumn === undefined) return;
    const quickFilter = quickFilters.get(modelColumn);
    const advancedFilter = advancedFilters.get(modelColumn);
    if (quickFilter == null && advancedFilter == null) {
      return;
    }

    let text = null;
    if (quickFilter != null) {
      const { text: filterText } = quickFilter;
      text = filterText;
      if (!text) {
        text = TableUtils.getFilterText(quickFilter.filter);
      }

      if (text != null) {
        const { fontWidthsLower, fontWidthsUpper } = metrics;
        const fontWidthLower = fontWidthsLower.get(context.font);
        const fontWidthUpper = fontWidthsUpper.get(context.font);

        const maxLength = columnWidth - filterBarHorizontalPadding * 2;
        text = this.textCellRenderer.getCachedTruncatedString(
          context,
          text,
          maxLength,
          fontWidthLower,
          fontWidthUpper
        );
      }
    }

    context.save();

    const isFilterValid = IrisGridRenderer.isFilterValid(
      advancedFilter,
      quickFilter
    );
    if (isFilterValid && filterBarExpandedActiveCellBackgroundColor != null) {
      // draw active filter background inside cell
      context.fillStyle = filterBarExpandedActiveCellBackgroundColor;
      context.fillRect(
        columnX + 1, // +1 left border
        columnHeaderHeight + 1, // +1 top border
        columnWidth - 1, // -1 right border
        filterBarHeight - 3 // -3 top, bottom border and bottom casing
      );
    } else if (filterBarErrorColor != null) {
      // draw error box inside cell
      context.fillStyle = filterBarErrorColor;
      context.lineWidth = 2;
      context.strokeStyle = filterBarErrorColor;
      // Because this is drawn with a strokeRect, we have to add/subtract half the,
      // linewidth from each side to make interior, in addition to accounting for any borders/casings
      const rectLeft = columnX + 2; // 1 for strokeRect, 1 for border
      const rectTop = columnHeaderHeight + 2; // 1 for strokeRect, 1 for border
      const rectWidth = columnWidth - 3; // for 2 border and 1 for strokeRect
      const rectHeight = filterBarHeight - 5; // -2 for strokeRect, -3 for top, bottom border and bottom casing
      context.strokeRect(rectLeft, rectTop, rectWidth, rectHeight);
    }

    if (text != null && text !== '') {
      const textX = columnX + filterBarHorizontalPadding;
      const textY = columnHeaderHeight + filterBarHeight * 0.5 + 1; // + 1 for border
      context.fillStyle = headerColor;
      context.fillText(text, textX, textY);
    }

    context.restore();
  }

  drawCollapsedFilterHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, theme } = state;
    const { headerSeparatorColor, filterBarCollapsedHeight } = theme;

    if (filterBarCollapsedHeight <= 0) {
      return;
    }

    const { gridX, gridY, maxX, visibleColumns, allColumnWidths, allColumnXs } =
      metrics;
    const columnHeaderHeight = gridY - filterBarCollapsedHeight;

    context.save();

    // Draw the background of the collapsed filter bar
    context.fillStyle = headerSeparatorColor;
    context.fillRect(gridX, columnHeaderHeight, maxX, filterBarCollapsedHeight);

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = allColumnWidths.get(column);
      const columnX = allColumnXs.get(column);
      if (columnX != null && columnWidth != null) {
        const x = columnX + gridX;
        // draw the collapsed cells
        this.drawCollapsedFilterHeader(context, state, column, x, columnWidth);
      }
    }

    context.restore();
  }

  drawCollapsedFilterHeader(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    column: VisibleIndex,
    columnX: Coordinate,
    columnWidth: number
  ): void {
    if (columnWidth <= 0) {
      return;
    }

    const { metrics, theme, quickFilters, advancedFilters } = state;
    const { modelColumns, gridY } = metrics;
    const modelColumn = modelColumns.get(column);

    if (modelColumn === undefined) return;
    const quickFilter = quickFilters.get(modelColumn);
    const advancedFilter = advancedFilters.get(modelColumn);

    const {
      filterBarCollapsedHeight,
      filterBarActiveColor,
      filterBarActiveBackgroundColor,
      filterBarErrorColor,
    } = theme;

    context.save();

    const isFilterValid = IrisGridRenderer.isFilterValid(
      advancedFilter,
      quickFilter
    );

    if (
      filterBarActiveBackgroundColor != null &&
      quickFilter == null &&
      advancedFilter == null
    ) {
      context.fillStyle = filterBarActiveBackgroundColor;
    } else if (filterBarActiveColor != null && isFilterValid) {
      context.fillStyle = filterBarActiveColor;
    } else if (filterBarErrorColor != null) {
      context.fillStyle = filterBarErrorColor;
    }

    const x = columnX + 1; // for gap between columns
    const y = gridY - filterBarCollapsedHeight;
    const rectWidth = columnWidth - 1; // for gap between columns
    const rectHeight = filterBarCollapsedHeight - 1; // for casing bottom
    context.fillRect(x, y, rectWidth, rectHeight);

    context.restore();
  }

  drawRowFooters(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, model, mouseX, mouseY, theme } = state;
    const {
      gridY,
      gridX,
      maxX,
      modelRows,
      floatingTopHeight,
      floatingBottomHeight,
      floatingRows,
      rowFooterWidth,
      height,
      horizontalBarHeight,
      verticalBarWidth,
      allRowHeights,
      allRowYs,
      width,
    } = metrics;
    // Only draw the footers on the floating rows
    if (rowFooterWidth <= 0 || floatingRows.length === 0) {
      return;
    }

    const {
      cellHorizontalPadding,
      floatingGridRowColor,
      floatingRowBackgroundColors,
      headerColor,
      rowHoverBackgroundColor,
    } = theme;

    context.translate(gridX, gridY);

    context.beginPath();
    const x = Math.min(maxX, width - rowFooterWidth - verticalBarWidth - gridX);
    context.fillStyle = floatingRowBackgroundColors;
    if (floatingTopHeight > 0) {
      context.rect(x, 0, rowFooterWidth, floatingTopHeight);
    }
    if (floatingBottomHeight > 0) {
      context.rect(
        x,
        height - gridY - horizontalBarHeight - floatingBottomHeight,
        rowFooterWidth,
        floatingBottomHeight
      );
    }
    context.fill();

    const mouseRow =
      mouseX != null &&
      mouseY != null &&
      mouseX >= gridX &&
      mouseX <= maxX + rowFooterWidth
        ? GridUtils.getRowAtY(mouseY, metrics)
        : null;
    if (
      rowHoverBackgroundColor != null &&
      mouseRow !== null &&
      floatingRows.includes(mouseRow)
    ) {
      context.fillStyle = rowHoverBackgroundColor;
      const y = allRowYs.get(mouseRow);
      const rowHeight = allRowHeights.get(mouseRow);
      assertNotNull(y);
      assertNotNull(rowHeight);
      context.fillRect(x, y, rowFooterWidth, rowHeight);
    }

    context.beginPath();
    if (floatingGridRowColor != null) {
      context.strokeStyle = floatingGridRowColor;
    }
    if (floatingTopHeight > 0) {
      context.moveTo(x + 0.5, 0.5);
      context.lineTo(x + 0.5, floatingTopHeight - 0.5);
    }
    if (floatingBottomHeight > 0) {
      const y = height - gridY - horizontalBarHeight - floatingBottomHeight;
      context.moveTo(x - 0.5, y + 0.5);
      context.lineTo(x - 0.5, y + floatingBottomHeight - 0.5);
    }
    context.stroke();

    context.fillStyle = headerColor;
    context.textAlign = 'left';

    const textX = x + cellHorizontalPadding;
    for (let i = 0; i < floatingRows.length; i += 1) {
      const row = floatingRows[i];
      const rowHeight = allRowHeights.get(row);
      const rowY = allRowYs.get(row);
      const modelRow = modelRows.get(row);
      if (rowY != null && rowHeight != null && modelRow != null) {
        const textY = rowY + rowHeight * 0.5;
        context.fillText(model.textForRowFooter(modelRow), textX, textY);
      }
    }

    context.translate(-gridX, -gridY);
  }

  getExpandButtonPosition(
    {
      mouseX,
      mouseY,
      metrics,
      theme,
    }: {
      mouseX: Coordinate | null;
      mouseY: Coordinate | null;
      metrics: GridMetrics | undefined;
      theme: GridThemeType;
    },
    depth: number | null
  ): {
    left: Coordinate | null;
    top: Coordinate | null;
    width: number | null;
    height: number | null;
  } {
    const NULL_POSITION = { left: null, top: null, width: null, height: null };
    if (mouseX == null || mouseY == null || depth == null || !metrics) {
      return NULL_POSITION;
    }
    const { rowHeight, left, top } = GridUtils.getCellInfoFromXY(
      mouseX,
      mouseY,
      metrics
    );

    assertNotNull(left);
    assertNotNull(rowHeight);
    assertNotNull(top);
    const { cellHorizontalPadding } = theme;

    const width = EXPAND_ICON_SIZE + 2 * cellHorizontalPadding;

    const buttonLeft = Math.max(left + EXPAND_ICON_SIZE * depth, metrics.gridX);
    const buttonTop = metrics.gridY + top;

    return {
      left: buttonLeft,
      top: buttonTop,
      width,
      height: rowHeight,
    };
  }
}

export default IrisGridRenderer;
