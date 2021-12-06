import Grid from '../Grid';
import { VisibleIndex } from '../GridMetrics';
import GridMouseHandler, { GridMouseHandlerResult } from '../GridMouseHandler';
import { GridPoint } from '../GridUtils';

/* eslint class-methods-use-this: "off" */
class GridVerticalScrollBarMouseHandler extends GridMouseHandler {
  static getTopWithOffsetFromRawTop(
    grid: Grid,
    rawTop: number
  ): { top: VisibleIndex; topOffset: number } {
    const theme = grid.getTheme();
    const { metrics, metricCalculator } = grid;
    if (!metrics) throw new Error('metrics not set');

    if (theme.scrollSnapToRow) {
      const top = Math.round(rawTop);
      const topOffset = 0;

      return { top, topOffset };
    }
    const top = Math.floor(rawTop);
    const topOffsetPercent = rawTop - top;
    let rowHeight = metrics.visibleRowHeights.get(top);
    if (rowHeight == null) {
      const metricState = grid.getMetricState();
      rowHeight = metricCalculator.getVisibleRowHeight(top, metricState);
    }
    const topOffset = rowHeight * topOffsetPercent;

    return { top, topOffset };
  }

  private dragOffset?: number;

  // to trigger pointer event blocking
  cursor = 'default';

  isInScrollBar(gridPoint: GridPoint, grid: Grid): boolean {
    const theme = grid.getTheme();

    const { scrollBarSize, scrollBarHoverSize } = theme;
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { x, y } = gridPoint;
    const { lastLeft, lastTop, columnHeaderHeight, height, width } = metrics;
    const scrollBarHeight = lastLeft > 0 ? height - scrollBarSize : height;
    return (
      scrollBarSize > 0 &&
      lastTop > 0 &&
      x >= width - scrollBarHoverSize &&
      x < width &&
      y > columnHeaderHeight &&
      y < scrollBarHeight
    );
  }

  onDown(gridPoint: GridPoint, grid: Grid): GridMouseHandlerResult {
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { y } = gridPoint;
    const {
      barHeight,
      handleHeight,
      lastTop,
      columnHeaderHeight,
      scrollY,
    } = metrics;
    if (!this.isInScrollBar(gridPoint, grid)) {
      return false;
    }

    const mouseBarY = y - columnHeaderHeight;
    if (mouseBarY >= scrollY && mouseBarY <= scrollY + handleHeight) {
      // Grabbed the vertical handle
      this.dragOffset = mouseBarY - scrollY;
      grid.setState({ isDraggingVerticalScrollBar: true });
    } else {
      // clicked elsewhere in bar
      this.dragOffset = 0;
      const rawTop = Math.min(
        Math.max(0, (mouseBarY / (barHeight - handleHeight)) * lastTop),
        lastTop
      );

      const {
        top: newTop,
        topOffset: newTopOffset,
      } = GridVerticalScrollBarMouseHandler.getTopWithOffsetFromRawTop(
        grid,
        rawTop
      );
      grid.setViewState({
        top: newTop,
        topOffset: newTopOffset,
        isDraggingVerticalScrollBar: true,
        isDragging: true,
      });
    }

    return true;
  }

  onMove(gridPoint: GridPoint, grid: Grid): GridMouseHandlerResult {
    return this.isInScrollBar(gridPoint, grid);
  }

  onDrag(gridPoint: GridPoint, grid: Grid): GridMouseHandlerResult {
    if (this.dragOffset != null) {
      const { y } = gridPoint;
      const { metrics } = grid;
      if (!metrics) throw new Error('metrics not set');

      const { barHeight, handleHeight, lastTop, columnHeaderHeight } = metrics;
      const mouseBarY = y - columnHeaderHeight;

      const rawTop = Math.min(
        Math.max(
          0,
          ((mouseBarY - this.dragOffset) / (barHeight - handleHeight)) * lastTop
        ),
        lastTop
      );

      const {
        top: newTop,
        topOffset: newTopOffset,
      } = GridVerticalScrollBarMouseHandler.getTopWithOffsetFromRawTop(
        grid,
        rawTop
      );
      grid.setViewState({
        top: newTop,
        topOffset: newTopOffset,
        isDraggingVerticalScrollBar: true,
        isDragging: true,
      });
      return true;
    }
    return false;
  }

  onUp(gridPoint: GridPoint, grid: Grid): GridMouseHandlerResult {
    if (this.dragOffset !== undefined) {
      this.dragOffset = undefined;
      grid.setState({ isDraggingVerticalScrollBar: false, isDragging: false });
    }

    return this.isInScrollBar(gridPoint, grid);
  }

  onClick(gridPoint: GridPoint, grid: Grid): GridMouseHandlerResult {
    return this.isInScrollBar(gridPoint, grid);
  }
}

export default GridVerticalScrollBarMouseHandler;
