import clamp from 'lodash.clamp';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridMouseHandler from '../GridMouseHandler';
import { VisibleIndex, GridPoint } from '../GridTypes';

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
    let rowHeight = metrics.allRowHeights.get(top);
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
    const { barTop, barHeight, width, hasVerticalBar } = metrics;

    return (
      hasVerticalBar &&
      scrollBarSize > 0 &&
      x >= width - scrollBarHoverSize &&
      x < width &&
      y > barTop &&
      y < barTop + barHeight
    );
  }

  getTopWithOffset(
    gridPoint: GridPoint,
    grid: Grid
  ): { top: number; topOffset: number } {
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { y } = gridPoint;
    const {
      barHeight,
      handleHeight,
      lastTop,
      barTop,
      rowCount,
      scrollableContentHeight,
      scrollableViewportHeight,
    } = metrics;

    const mouseBarY = y - barTop;
    const scrollPercent = clamp(
      (mouseBarY - (this.dragOffset ?? 0)) / (barHeight - handleHeight),
      0,
      1
    );

    if (rowCount === 1) {
      return {
        top: 0,
        topOffset:
          scrollPercent * (scrollableContentHeight - scrollableViewportHeight),
      };
    }

    const rawTop = scrollPercent * lastTop;
    return GridVerticalScrollBarMouseHandler.getTopWithOffsetFromRawTop(
      grid,
      rawTop
    );
  }

  onDown(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { y } = gridPoint;
    const { handleHeight, barTop, scrollY } = metrics;
    if (!this.isInScrollBar(gridPoint, grid)) {
      return false;
    }

    const mouseBarY = y - barTop;
    if (mouseBarY >= scrollY && mouseBarY <= scrollY + handleHeight) {
      // Grabbed the vertical handle
      this.dragOffset = mouseBarY - scrollY;
      grid.setState({ isDraggingVerticalScrollBar: true });
    } else {
      // clicked elsewhere in bar
      this.dragOffset = 0;

      const { top: newTop, topOffset: newTopOffset } = this.getTopWithOffset(
        gridPoint,
        grid
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

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.isInScrollBar(gridPoint, grid);
  }

  onDrag(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.dragOffset != null) {
      const { top: newTop, topOffset: newTopOffset } = this.getTopWithOffset(
        gridPoint,
        grid
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

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.dragOffset !== undefined) {
      this.dragOffset = undefined;
      grid.setState({ isDraggingVerticalScrollBar: false, isDragging: false });
    }

    return this.isInScrollBar(gridPoint, grid);
  }

  onClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.isInScrollBar(gridPoint, grid);
  }
}

export default GridVerticalScrollBarMouseHandler;
