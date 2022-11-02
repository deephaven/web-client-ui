/* eslint react/destructuring-assignment: "off" */
/* eslint class-methods-use-this: "off" */
/* eslint no-param-reassign: "off" */
import {
  dhSortDown,
  dhSortUp,
  vsTriangleDown,
  vsTriangleRight,
  vsLinkExternal,
  IconDefinition,
} from '@deephaven/icons';
import {
  BoundedAxisRange,
  BoxCoordinates,
  Coordinate,
  getOrThrow,
  GridMetrics,
  GridRangeIndex,
  GridRenderer,
  GridRenderState,
  GridThemeType,
  GridUtils,
  VisibleIndex,
} from '@deephaven/grid';
import { Sort } from '@deephaven/jsapi-shim';
import { TableUtils, ReverseType } from '@deephaven/jsapi-utils';
import { assertNotNull } from '@deephaven/utils';
import {
  AdvancedFilterMap,
  QuickFilterMap,
  AdvancedFilter,
  QuickFilter,
} from './CommonTypes';
import { IrisGridThemeType } from './IrisGridTheme';
import IrisGridModel from './IrisGridModel';

const ICON_NAMES = Object.freeze({
  SORT_UP: 'sortUp',
  SORT_DOWN: 'sortDown',
  CARET_DOWN: 'caretDown',
  CARET_RIGHT: 'caretRight',
  CELL_OVERFLOW: 'cellOverflow',
});

const ICON_SIZE = 16;

export type IrisGridRenderState = GridRenderState & {
  model: IrisGridModel;
  theme: IrisGridThemeType;
  hoverSelectColumn: GridRangeIndex;
  isSelectingColumn: boolean;
  loadingScrimProgress: number;
  reverseType: ReverseType;
  isFilterBarShown: boolean;
  advancedFilters: AdvancedFilterMap;
  quickFilters: QuickFilterMap;
  isMenuShown: boolean;
};
/**
 * Handles rendering some of the Iris specific features, such as sorting icons, sort bar display
 * */
class IrisGridRenderer extends GridRenderer {
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

  constructor() {
    super();
    this.icons = {};

    this.initIcons();
  }

  icons: Record<string, Path2D>;

  initIcons(): void {
    this.setIcon(ICON_NAMES.SORT_UP, dhSortUp);
    this.setIcon(ICON_NAMES.SORT_DOWN, dhSortDown);
    this.setIcon(ICON_NAMES.CARET_DOWN, vsTriangleDown);
    this.setIcon(ICON_NAMES.CARET_RIGHT, vsTriangleRight);
    this.setIcon(ICON_NAMES.CELL_OVERFLOW, vsLinkExternal);
  }

  // Scales the icon to be square and match the global ICON_SIZE
  setIcon(name: string, faIcon: IconDefinition): void {
    const path = Array.isArray(faIcon.icon[4])
      ? faIcon.icon[4][0]
      : faIcon.icon[4];
    const icon = new Path2D(path);
    const scaledIcon = new Path2D();
    const scaleMatrix = {
      a: ICON_SIZE / faIcon.icon[0],
      d: ICON_SIZE / faIcon.icon[1],
    };
    scaledIcon.addPath(icon, scaleMatrix);
    this.icons[name] = scaledIcon;
  }

  getIcon(name: string): Path2D {
    return this.icons[name];
  }

  getSortIcon(sort: Sort | null): Path2D | null {
    if (!sort) {
      return null;
    }
    if (sort.direction === TableUtils.sortDirection.ascending) {
      return this.getIcon(ICON_NAMES.SORT_UP);
    }
    if (sort.direction === TableUtils.sortDirection.descending) {
      return this.getIcon(ICON_NAMES.SORT_DOWN);
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
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = modelColumns.get(column);
    if (modelColumn === undefined) {
      return;
    }
    const value = model.valueForCell(modelColumn, modelRow);
    if (TableUtils.isTextType(model.columns[modelColumn]?.type)) {
      if (value === null || value === '') {
        const originalFont = context.font;
        context.font = `italic ${originalFont}`;
        const displayValue = value === null ? 'null' : 'empty';
        super.drawCellContent(context, state, column, row, displayValue);
        context.font = originalFont;
        return;
      }
    }
    super.drawCellContent(context, state, column, row);
  }

  drawGroupedColumnLine(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, model, theme } = state;
    const { groupedColumns, columns } = model;
    const { maxY, visibleColumnWidths, visibleColumnXs } = metrics;
    if (
      groupedColumns.length === 0 ||
      theme.groupedColumnDividerColor == null
    ) {
      return;
    }

    const lastGroupedColumn = groupedColumns[groupedColumns.length - 1];
    const modelIndex = columns.findIndex(
      c => c.name === lastGroupedColumn.name
    );
    const columnX = visibleColumnXs.get(modelIndex);
    const columnWidth = visibleColumnWidths.get(modelIndex);
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
    const { visibleRowYs, maxX } = metrics;
    const { pendingRowCount } = model;
    if (pendingRowCount <= 0) {
      return;
    }

    const firstPendingRow =
      model.rowCount - model.pendingRowCount - model.floatingBottomRowCount;
    let y = visibleRowYs.get(firstPendingRow);
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

    const { visibleColumnWidths, visibleColumnXs, maxY } = metrics;

    const x = visibleColumnXs.get(hoverSelectColumn);
    const columnWidth = visibleColumnWidths.get(hoverSelectColumn);
    assertNotNull(x);
    assertNotNull(columnWidth);

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
    context.globalCompositeOperation = 'overlay';
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

    const { theme, metrics, model, reverseType } = state;
    const { columnHeaderHeight } = metrics;

    this.drawFilterHeaders(context, state);

    if (columnHeaderHeight <= 0) {
      return;
    }

    const { sort } = model;
    // if there is only one sort bar, it is interior to the header to save space
    if (sort.length === 1) {
      const hasReverse = reverseType !== TableUtils.REVERSE_TYPE.NONE;

      let color;
      if (hasReverse) {
        color = theme.headerReverseBarColor;
      } else {
        color = theme.headerSortBarColor;
      }
      this.drawHeaderBar(
        context,
        state,
        color,
        hasReverse ? theme.reverseHeaderBarHeight : theme.sortHeaderBarHeight
      );
    } else if (sort.length > 1) {
      // if there's multiple bars, the sort is interior to header
      // and the reverse claims space in the table
      if (
        // has table reverse
        reverseType !== TableUtils.REVERSE_TYPE.NONE
      ) {
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
    const { metrics, model, isMenuShown } = state;
    const { columnHeaderMaxDepth } = model;
    const { width } = metrics;
    const bounds = {
      ...boundsProp,
      maxX:
        depth === columnHeaderMaxDepth - 1 && boundsProp.maxX === width
          ? width - (isMenuShown ? 0 : 30) // Account for the menu button
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
      visibleColumnWidths,
      visibleColumnXs,
      gridX,
      columnHeaderHeight,
      fontWidths,
    } = metrics;

    const { headerHorizontalPadding } = theme;
    const columnWidth = getOrThrow(visibleColumnWidths, index, 0);
    const columnX = getOrThrow(visibleColumnXs, index) + gridX;
    const modelColumn = modelColumns.get(index);

    if (modelColumn == null) {
      return;
    }

    const sort = TableUtils.getSortForColumn(model.sort, modelColumn);

    if (!sort) {
      return;
    }

    const icon = this.getSortIcon(sort);
    if (!icon) {
      return;
    }

    const text = model.textForColumnHeader(modelColumn);
    if (text === undefined) {
      return;
    }

    const fontWidth =
      fontWidths.get(context.font) ?? GridRenderer.DEFAULT_FONT_WIDTH;
    assertNotNull(fontWidth);
    const textWidth = text.length * fontWidth;
    const textRight = gridX + columnX + textWidth + headerHorizontalPadding;
    let { maxX } = bounds;
    maxX -= headerHorizontalPadding;
    const defaultX =
      gridX + columnX + columnWidth - headerHorizontalPadding - 1;

    const x = textRight > maxX ? textRight + 1 : Math.min(maxX, defaultX);
    const yOffset =
      sort.direction === TableUtils.sortDirection.ascending ? -6 : -12;
    const y = columnHeaderHeight * 0.5 + yOffset;

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
      visibleColumnWidths,
      visibleColumnXs,
    } = metrics;

    const columnHeaderHeight = gridY - filterBarHeight;

    context.save();

    context.font = theme.font;
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
      const columnX = getOrThrow(visibleColumnXs, column);
      const columnWidth = getOrThrow(visibleColumnWidths, column);
      if (model.isFilterable(modelColumn) && columnWidth > 0) {
        const x1 = gridX + (columnX ?? 0);
        context.rect(x1 + 0.5, y1 + 0.5, columnWidth, filterBarHeight - 2); // 1 for the border, 1 for the casing
      }
    }
    context.stroke();

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = getOrThrow(visibleColumnWidths, column);
      const columnX = getOrThrow(visibleColumnXs, column);
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
        const { fontWidths } = metrics;
        let fontWidth = fontWidths.get(context.font);
        if (fontWidth == null || fontWidth === 0) {
          fontWidth = context.measureText('8').width;
          if (!fontWidth) {
            fontWidth = 10;
          }
        }

        const maxLength =
          (columnWidth - filterBarHorizontalPadding * 2) / fontWidth;
        if (maxLength <= 0) {
          text = '';
        } else if (text.length > maxLength) {
          text = `${text.substring(0, maxLength - 1)}…`;
        }
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

    const {
      gridX,
      gridY,
      maxX,
      visibleColumns,
      visibleColumnWidths,
      visibleColumnXs,
    } = metrics;
    const columnHeaderHeight = gridY - filterBarCollapsedHeight;

    context.save();

    // Draw the background of the collapsed filter bar
    context.fillStyle = headerSeparatorColor;
    context.fillRect(gridX, columnHeaderHeight, maxX, filterBarCollapsedHeight);

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = visibleColumnWidths.get(column);
      const columnX = visibleColumnXs.get(column);
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

  drawTreeMarker(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    columnX: Coordinate,
    rowY: Coordinate,
    treeBox: BoxCoordinates,
    color: string,
    isExpanded: boolean
  ): void {
    context.save();
    const { x1, y1 } = treeBox;
    const markerIcon = isExpanded
      ? this.getIcon(ICON_NAMES.CARET_DOWN)
      : this.getIcon(ICON_NAMES.CARET_RIGHT);
    const iconX = columnX + x1 - 2;
    const iconY = rowY + y1 + 2.5;

    context.fillStyle = color;
    context.textAlign = 'center';
    context.translate(iconX, iconY);
    context.fill(markerIcon);
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
      visibleRowHeights,
      visibleRowYs,
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
      const y = visibleRowYs.get(mouseRow);
      const rowHeight = visibleRowHeights.get(mouseRow);
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
      const rowHeight = visibleRowHeights.get(row);
      const rowY = visibleRowYs.get(row);
      const modelRow = modelRows.get(row);
      if (rowY != null && rowHeight != null && modelRow != null) {
        const textY = rowY + rowHeight * 0.5;
        context.fillText(model.textForRowFooter(modelRow), textX, textY);
      }
    }

    context.translate(-gridX, -gridY);
  }

  // This will shrink the size the text may take when the overflow button is rendered
  // The text will truncate to a smaller width and won't overlap the button
  getTextRenderMetrics(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): {
    width: number;
    x: Coordinate;
    y: Coordinate;
  } {
    const textMetrics = super.getTextRenderMetrics(context, state, column, row);

    const { mouseX, mouseY, metrics } = state;

    if (mouseX == null || mouseY == null) {
      return textMetrics;
    }

    const { column: mouseColumn, row: mouseRow } = GridUtils.getGridPointFromXY(
      mouseX,
      mouseY,
      metrics
    );

    if (column === mouseColumn && row === mouseRow) {
      const { left } = this.getCellOverflowButtonPosition(state);
      if (this.shouldRenderOverflowButton(state) && left != null) {
        textMetrics.width = left - metrics.gridX - textMetrics.x;
      }
    }
    return textMetrics;
  }

  shouldRenderOverflowButton(state: IrisGridRenderState): boolean {
    const { context, mouseX, mouseY, metrics, model, theme } = state;
    if (mouseX == null || mouseY == null) {
      return false;
    }

    const { row, column, modelRow, modelColumn } = GridUtils.getCellInfoFromXY(
      mouseX,
      mouseY,
      metrics
    );

    if (
      row == null ||
      column == null ||
      modelRow == null ||
      modelColumn == null ||
      !TableUtils.isStringType(model.columns[modelColumn].type)
    ) {
      return false;
    }

    const text = model.textForCell(modelColumn, modelRow) ?? '';
    const { width: textWidth } = super.getTextRenderMetrics(
      context,
      state,
      column,
      row
    );
    const fontWidth =
      metrics.fontWidths.get(theme.font) ?? IrisGridRenderer.DEFAULT_FONT_WIDTH;

    context.save();
    context.font = theme.font;

    const truncatedText = this.getCachedTruncatedString(
      context,
      text,
      textWidth,
      fontWidth,
      model.truncationCharForCell(modelColumn, modelRow)
    );
    context.restore();

    return text !== '' && truncatedText !== text;
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
    theme: GridThemeType;
  }): {
    left: Coordinate | null;
    top: Coordinate | null;
    width: number | null;
    height: number | null;
  } {
    const NULL_POSITION = { left: null, top: null, width: null, height: null };
    if (mouseX == null || mouseY == null || !metrics) {
      return NULL_POSITION;
    }
    const { rowHeight, columnWidth, left, top } = GridUtils.getCellInfoFromXY(
      mouseX,
      mouseY,
      metrics
    );

    assertNotNull(left);
    assertNotNull(columnWidth);
    assertNotNull(top);
    const { width: gridWidth, verticalBarWidth } = metrics;
    const { cellHorizontalPadding } = theme;

    const width = ICON_SIZE + 2 * cellHorizontalPadding;
    const height = rowHeight;
    // Right edge of column or of visible grid, whichever is smaller
    const right = Math.min(
      metrics.gridX + left + columnWidth,
      gridWidth - verticalBarWidth
    );
    const buttonLeft = right - width;
    const buttonTop = metrics.gridY + top;

    return { left: buttonLeft, top: buttonTop, width, height };
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
    const icon = this.getIcon(ICON_NAMES.CELL_OVERFLOW);
    if (buttonLeft != null && buttonTop != null) {
      context.translate(buttonLeft + cellHorizontalPadding, buttonTop + 2);
    }
    context.fill(icon);

    context.restore();
  }
}

export default IrisGridRenderer;
