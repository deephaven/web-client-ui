/* eslint react/destructuring-assignment: "off" */
/* eslint class-methods-use-this: "off" */
/* eslint no-param-reassign: "off" */
import {
  dhSortDown,
  dhSortUp,
  vsTriangleDown,
  vsTriangleRight,
} from '@deephaven/icons';
import { GridRenderer, GridUtils } from '@deephaven/grid';
import TableUtils from './TableUtils';

const ICON_NAMES = Object.freeze({
  SORT_UP: 'sortUp',
  SORT_DOWN: 'sortDown',
  CARET_DOWN: 'caretDown',
  CARET_RIGHT: 'caretRight',
});

const ICON_SCALE = 0.03;

/**
 * Handles rendering some of the Iris specific features, such as sorting icons, sort bar display
 * */
class IrisGridRenderer extends GridRenderer {
  static isFilterValid(advancedFilter, quickFilter) {
    const isAdvancedFilterValid =
      advancedFilter == null || advancedFilter.filter != null;
    const isQuickFilterValid =
      quickFilter == null || quickFilter.filter != null;
    return isAdvancedFilterValid && isQuickFilterValid;
  }

  constructor() {
    super();

    this.initIcons();
  }

  initIcons() {
    this.icons = {};

    this.setIcon(ICON_NAMES.SORT_UP, dhSortUp);
    this.setIcon(ICON_NAMES.SORT_DOWN, dhSortDown);
    this.setIcon(ICON_NAMES.CARET_DOWN, vsTriangleDown);
    this.setIcon(ICON_NAMES.CARET_RIGHT, vsTriangleRight);
  }

  setIcon(name, faIcon) {
    this.icons[name] = new Path2D(faIcon.icon[4]);
  }

  getIcon(name) {
    return this.icons[name];
  }

  getSortIcon(sort) {
    if (!sort) {
      return null;
    }
    if (sort.direction === TableUtils.sortDirection.ascending) {
      return new Path2D(this.getIcon(ICON_NAMES.SORT_UP));
    }
    if (sort.direction === TableUtils.sortDirection.descending) {
      return new Path2D(this.getIcon(ICON_NAMES.SORT_DOWN));
    }
    return null;
  }

  drawCanvas(state) {
    super.drawCanvas(state);

    this.drawScrim(state);
    // this.drawCellOverflowButton(state);
  }

  drawGridLines(context, state) {
    super.drawGridLines(context, state);

    this.drawGroupedColumnLine(context, state);

    this.drawPendingRowLine(context, state);
  }

  drawCellContent(context, state, column, row) {
    const { metrics, model } = state;
    const { modelColumns, modelRows } = metrics;
    const modelRow = modelRows.get(row);
    const modelColumn = modelColumns.get(column);
    const value = model.valueForCell(modelColumn, modelRow);
    if (TableUtils.isTextType(model.columns[modelColumn].type)) {
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

  drawGroupedColumnLine(context, state) {
    const { metrics, model, theme } = state;
    const { groupedColumns, columns } = model;
    const { maxY, visibleColumnWidths, visibleColumnXs } = metrics;
    if (groupedColumns.length === 0 || !theme.groupedColumnDividerColor) {
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

  drawPendingRowLine(context, state) {
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

  drawMouseColumnHover(context, state) {
    const { theme, metrics, hoverSelectColumn } = state;
    if (hoverSelectColumn == null || !theme.linkerColumnHoverBackgroundColor) {
      return;
    }

    const { visibleColumnWidths, visibleColumnXs, maxY } = metrics;

    const x = visibleColumnXs.get(hoverSelectColumn);
    const columnWidth = visibleColumnWidths.get(hoverSelectColumn);

    context.fillStyle = theme.linkerColumnHoverBackgroundColor;
    context.fillRect(x, 0, columnWidth, maxY);
  }

  drawMouseRowHover(context, state) {
    const { isSelectingColumn } = state;
    if (!isSelectingColumn) {
      super.drawMouseRowHover(context, state);
    }
  }

  drawScrim(state) {
    const { context, loadingScrimProgress, metrics, theme } = state;
    if (loadingScrimProgress == null) {
      return;
    }

    const { width, height, gridY } = metrics;
    const { scrimBlurSize, scrimColor } = theme;

    context.save();

    // Use global composite so we can just change the underlying layer to grayscale
    context.globalCompositeOperation = 'color';
    context.filter = `blur(${scrimBlurSize}px)`;
    context.fillStyle = scrimColor;

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

    context.restore();
  }

  drawColumnHeaders(context, state) {
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
      this.drawHeaderBar(
        context,
        state,
        hasReverse ? theme.headerReverseBarColor : theme.headerSortBarColor,
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

  drawHeaderBar(context, state, color, barHeight, interior = true) {
    const { theme, metrics } = state;
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
      columnHeaderHeight - barHeight - 2 + offset,
      width,
      barHeight + 2
    );
    context.fillStyle = color;
    context.fillRect(
      0,
      columnHeaderHeight - barHeight - 1 + offset,
      width,
      barHeight
    );
  }

  drawColumnHeader(context, state, column, columnX, columnWidth) {
    super.drawColumnHeader(context, state, column, columnX, columnWidth);

    const { metrics, model, theme } = state;
    const { modelColumns } = metrics;
    const modelColumn = modelColumns.get(column);
    const sort = TableUtils.getSortForColumn(model.sort, modelColumn);
    const icon = this.getSortIcon(sort);
    if (!icon) {
      return;
    }

    const { columnHeaderHeight, gridX } = metrics;

    const x = gridX + columnX + columnWidth - 13;
    const yOffset =
      sort.direction === TableUtils.sortDirection.ascending ? -6 : -12;
    const y = columnHeaderHeight * 0.5 + yOffset;
    const gradientWidth = 12;
    const gradientX = x - 3;

    context.save();

    context.beginPath();
    context.rect(columnX, 0, columnWidth, columnHeaderHeight);
    context.clip();

    const gradient = context.createLinearGradient(
      gradientX,
      0,
      gradientX + 5,
      0
    );
    gradient.addColorStop(0, `${theme.headerBackgroundColor}00`);
    gradient.addColorStop(1, `${theme.headerBackgroundColor}CD`);

    context.fillStyle = gradient;
    context.fillRect(gradientX, 0, gradientWidth, columnHeaderHeight);

    context.fillStyle = theme.headerSortBarColor;
    context.translate(x, y);
    context.scale(ICON_SCALE, ICON_SCALE);
    context.fill(icon);

    context.restore();
  }

  drawFilterHeaders(context, state) {
    const { isFilterBarShown, quickFilters, advancedFilters } = state;

    if (isFilterBarShown) {
      this.drawExpandedFilterHeaders(context, state);
    } else if (
      (quickFilters && quickFilters.size > 0) ||
      (advancedFilters && advancedFilters.size > 0)
    ) {
      this.drawCollapsedFilterHeaders(context, state);
    }
  }

  drawExpandedFilterHeaders(context, state) {
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
      (quickFilters && quickFilters.size > 0) ||
      (advancedFilters && advancedFilters.size > 0)
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
    if (theme.filterBarSeparatorColor) {
      const y1 = columnHeaderHeight;
      context.strokeStyle = theme.filterBarSeparatorColor;
      context.beginPath();

      for (let i = 0; i < visibleColumns.length; i += 1) {
        const column = visibleColumns[i];
        const modelColumn = modelColumns.get(column);
        const columnX = visibleColumnXs.get(column);
        const columnWidth = visibleColumnWidths.get(column);
        if (model.isFilterable(modelColumn) && columnWidth > 0) {
          const x1 = gridX + columnX;
          context.rect(x1 + 0.5, y1 + 0.5, columnWidth, filterBarHeight - 2); // 1 for the border, 1 for the casing
        }
      }
      context.stroke();
    }

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = visibleColumnWidths.get(column);
      const x = visibleColumnXs.get(column) + gridX;
      this.drawExpandedFilterHeader(context, state, column, x, columnWidth);
    }

    context.restore();
  }

  drawExpandedFilterHeader(context, state, column, columnX, columnWidth) {
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

      if (text) {
        const { fontWidths } = metrics;
        let fontWidth = fontWidths.get(context.font);
        if (!fontWidth) {
          fontWidth = context.measureText('8');
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
    if (isFilterValid) {
      // draw active filter background inside cell
      context.fillStyle = filterBarExpandedActiveCellBackgroundColor;
      context.fillRect(
        columnX + 1, // +1 left border
        columnHeaderHeight + 1, // +1 top border
        columnWidth - 1, // -1 right border
        filterBarHeight - 3 // -3 top, bottom border and bottom casing
      );
    } else {
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

    if (text) {
      const textX = columnX + filterBarHorizontalPadding;
      const textY = columnHeaderHeight + filterBarHeight * 0.5 + 1; // + 1 for border
      context.fillStyle = headerColor;
      context.fillText(text, textX, textY);
    }

    context.restore();
  }

  drawCollapsedFilterHeaders(context, state) {
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
      const x = visibleColumnXs.get(column) + gridX;
      // draw the collapsed cells
      this.drawCollapsedFilterHeader(context, state, column, x, columnWidth);
    }

    context.restore();
  }

  drawCollapsedFilterHeader(context, state, column, columnX, columnWidth) {
    if (columnWidth <= 0) {
      return;
    }

    const { metrics, theme, quickFilters, advancedFilters } = state;
    const { modelColumns, gridY } = metrics;
    const modelColumn = modelColumns.get(column);

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
    if (quickFilter == null && advancedFilter == null) {
      context.fillStyle = filterBarActiveBackgroundColor;
    } else if (isFilterValid) {
      context.fillStyle = filterBarActiveColor;
    } else {
      context.fillStyle = filterBarErrorColor;
    }

    const x = columnX + 1; // for gap between columns
    const y = gridY - filterBarCollapsedHeight;
    const rectWidth = columnWidth - 1; // for gap between columns
    const rectHeight = filterBarCollapsedHeight - 1; // for casing bottom
    context.fillRect(x, y, rectWidth, rectHeight);

    context.restore();
  }

  drawTreeMarker(context, state, columnX, rowY, treeBox, color, isExpanded) {
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
    context.scale(ICON_SCALE, ICON_SCALE);
    context.fill(markerIcon);
    context.restore();
  }

  drawRowFooters(context, state) {
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
      mouseX >= gridX && mouseX <= maxX + rowFooterWidth
        ? GridUtils.getRowAtY(mouseY, metrics)
        : null;
    if (mouseRow !== null && floatingRows.includes(mouseRow)) {
      context.fillStyle = rowHoverBackgroundColor;
      const y = visibleRowYs.get(mouseRow);
      const rowHeight = visibleRowHeights.get(mouseRow);
      context.fillRect(x, y, rowFooterWidth, rowHeight);
    }

    context.beginPath();
    context.strokeStyle = floatingGridRowColor;
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
      const textY = rowY + rowHeight * 0.5;
      context.fillText(model.textForRowFooter(modelRow), textX, textY);
    }

    context.translate(-gridX, -gridY);
  }

  drawCellOverflowButton(state) {
    const { context, mouseX, mouseY, theme, metrics, model } = state;
    if (mouseX == null || mouseY == null) return;

    const { row, column } = GridUtils.getGridPointFromXY(
      mouseX,
      mouseY,
      metrics
    );
    if (row == null || column == null) {
      return;
    }

    const {
      visibleColumnWidths,
      visibleRowHeights,
      visibleColumnXs,
      visibleRowYs,
      modelColumns,
      modelRows,
      width,
    } = metrics;

    const {
      cellHorizontalPadding,
      overflowButtonBackgroundColor,
      overflowButtonHoverBackgroundColor,
    } = theme;

    const modelColumn = modelColumns.get(column);
    const modelRow = modelRows.get(row);

    const left = visibleColumnXs.get(column);
    const top = visibleRowYs.get(row);
    const columnWidth = visibleColumnWidths.get(column);
    const rowHeight = visibleRowHeights.get(row);

    const text = model.textForCell(modelColumn, modelRow) ?? '';
    const textWidth = columnWidth - 2 * cellHorizontalPadding;
    const fontWidth =
      metrics.fontWidths.get(context.font) ??
      IrisGridRenderer.DEFAULT_FONT_WIDTH;

    const truncatedText = this.getCachedTruncatedString(
      context,
      text,
      textWidth,
      fontWidth
    );

    if (text === '' || truncatedText === text) {
      return;
    }

    const buttonWidth = 30;
    const buttonHeight = 12;
    const buttonRight =
      Math.min(
        metrics.gridX + left + columnWidth,
        width - 2 * cellHorizontalPadding
      ) - cellHorizontalPadding;
    const buttonLeft = buttonRight - buttonWidth;
    const buttonTop =
      metrics.gridY + top + rowHeight * 0.5 - buttonHeight * 0.5;

    context.save();
    context.clearRect(
      buttonLeft - 2,
      buttonTop - 2,
      buttonWidth + 4,
      buttonHeight + 4
    );
    const path = this.createRoundedRect(
      buttonLeft,
      buttonTop,
      buttonWidth,
      buttonHeight,
      buttonHeight / 2
    );

    if (
      mouseX >= buttonLeft &&
      mouseX <= buttonRight &&
      mouseY >= buttonTop &&
      mouseY <= buttonTop + buttonHeight
    ) {
      context.fillStyle = overflowButtonHoverBackgroundColor;
    } else {
      context.fillStyle = overflowButtonBackgroundColor;
    }
    context.fill(path);

    // context.fillArc
    context.restore();
  }
}

export default IrisGridRenderer;
