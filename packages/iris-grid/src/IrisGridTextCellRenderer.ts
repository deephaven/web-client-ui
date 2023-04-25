/* eslint-disable class-methods-use-this */
import {
  BoxCoordinates,
  Coordinate,
  DEFAULT_FONT_WIDTH,
  getOrThrow,
  GridMetrics,
  GridThemeType,
  GridUtils,
  TextCellRenderer,
  VisibleIndex,
} from '@deephaven/grid';
import { TableUtils } from '@deephaven/jsapi-utils';
import { IrisGridRenderState } from './IrisGridRenderer';
import { ICON_SIZE, getIcon } from './IrisGridIcons';

class IrisGridTextCellRenderer extends TextCellRenderer {
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
        super.drawCellContent(context, state, column, row);
        context.font = originalFont;
        return;
      }
    }
    super.drawCellContent(context, state, column, row);
  }

  // This will shrink the size the text may take when the overflow button is rendered
  // The text will truncate to a smaller width and won't overlap the button
  getTextRenderMetrics(
    state: IrisGridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): {
    width: number;
    x: Coordinate;
    y: Coordinate;
  } {
    const textMetrics = GridUtils.getTextRenderMetrics(state, column, row);

    const { mouseX, mouseY, metrics, theme } = state;

    if (mouseX == null || mouseY == null) {
      return textMetrics;
    }

    const { column: mouseColumn, row: mouseRow } = GridUtils.getGridPointFromXY(
      mouseX,
      mouseY,
      metrics
    );

    if (column === mouseColumn && row === mouseRow) {
      const { left } = this.getCellOverflowButtonPosition(
        mouseX,
        mouseY,
        metrics,
        theme
      );
      if (this.shouldRenderOverflowButton(state) && left != null) {
        textMetrics.width = left - metrics.gridX - textMetrics.x;
      }
    }
    return textMetrics;
  }

  getCellOverflowButtonPosition(
    mouseX: Coordinate | null,
    mouseY: Coordinate | null,
    metrics: GridMetrics | undefined,
    theme: GridThemeType
  ): {
    left: Coordinate | null;
    top: Coordinate | null;
    width: number | null;
    height: number | null;
  } {
    const NULL_POSITION = { left: null, top: null, width: null, height: null };
    if (mouseX == null || mouseY == null || metrics == null) {
      return NULL_POSITION;
    }
    const { rowHeight, columnWidth, left, top } = GridUtils.getCellInfoFromXY(
      mouseX,
      mouseY,
      metrics
    );

    if (left == null || columnWidth == null || top == null) {
      return NULL_POSITION;
    }

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
    const { width: textWidth } = GridUtils.getTextRenderMetrics(
      state,
      column,
      row
    );
    const fontWidth = metrics.fontWidths.get(theme.font) ?? DEFAULT_FONT_WIDTH;

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
      ? getIcon('caretDown')
      : getIcon('caretRight');
    const iconX = columnX + x1 - 2;
    const iconY = rowY + y1 + 2.5;

    context.fillStyle = color;
    context.textAlign = 'center';
    context.translate(iconX, iconY);
    context.fill(markerIcon);
    context.restore();
  }
}

export default IrisGridTextCellRenderer;
