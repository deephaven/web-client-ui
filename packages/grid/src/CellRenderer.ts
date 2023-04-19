/* eslint-disable class-methods-use-this */
import { getOrThrow } from '@deephaven/utils';
import { isExpandableGridModel } from './ExpandableGridModel';
import { VisibleIndex, Coordinate, BoxCoordinates } from './GridMetrics';
import { GridRenderState } from './GridRendererTypes';
import { GridColor } from './GridTheme';

export type CellRendererType = 'text' | 'databar';

abstract class CellRenderer {
  abstract drawCellContent(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): void;

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
      allColumnXs,
      allColumnWidths,
      allRowYs,
      allRowHeights,
      visibleRowTreeBoxes,
    } = metrics;
    const { treeMarkerColor, treeMarkerHoverColor } = theme;
    const columnX = getOrThrow(allColumnXs, firstColumn);
    const columnWidth = getOrThrow(allColumnWidths, firstColumn);
    const rowY = getOrThrow(allRowYs, row);
    const rowHeight = getOrThrow(allRowHeights, row);
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
}

export default CellRenderer;
