import clamp from 'lodash.clamp';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import { VisibleIndex } from '../GridMetrics';
import GridMouseHandler from '../GridMouseHandler';
import { GridPoint } from '../GridUtils';

/* eslint class-methods-use-this: "off" */
class GridHorizontalScrollBarMouseHandler extends GridMouseHandler {
  static getLeftWithOffsetFromRawLeft(
    grid: Grid,
    rawLeft: number
  ): { left: VisibleIndex; leftOffset: number } {
    const theme = grid.getTheme();
    const { metrics, metricCalculator } = grid;
    if (!metrics) throw new Error('metrics not set');

    if (theme.scrollSnapToColumn) {
      const left = Math.round(rawLeft);
      const leftOffset = 0;

      return { left, leftOffset };
    }
    const left = Math.floor(rawLeft);
    const leftOffsetPercent = rawLeft - left;
    let columnWidth = metrics.allColumnWidths.get(left);
    if (columnWidth == null) {
      const metricState = grid.getMetricState();
      columnWidth = metricCalculator.getVisibleColumnWidth(left, metricState);
    }
    const leftOffset = columnWidth * leftOffsetPercent;

    return { left, leftOffset };
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
    const { barLeft, barWidth, height, hasHorizontalBar } = metrics;

    return (
      hasHorizontalBar &&
      scrollBarSize > 0 &&
      y >= height - scrollBarHoverSize &&
      y < height &&
      x > barLeft &&
      x < barLeft + barWidth
    );
  }

  getLeftWithOffset(
    gridPoint: GridPoint,
    grid: Grid
  ): { left: number; leftOffset: number } {
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { x } = gridPoint;
    const {
      barWidth,
      handleWidth,
      lastLeft,
      barLeft,
      columnCount,
      scrollableContentWidth,
      scrollableViewportWidth,
    } = metrics;

    const mouseBarX = x - barLeft;
    const scrollPercent = clamp(
      (mouseBarX - (this.dragOffset ?? 0)) / (barWidth - handleWidth),
      0,
      1
    );

    if (columnCount === 1) {
      return {
        left: 0,
        leftOffset:
          scrollPercent * (scrollableContentWidth - scrollableViewportWidth),
      };
    }

    const rawLeft = scrollPercent * lastLeft;
    return GridHorizontalScrollBarMouseHandler.getLeftWithOffsetFromRawLeft(
      grid,
      rawLeft
    );
  }

  onDown(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { x } = gridPoint;
    const { handleWidth, barLeft, scrollX } = metrics;
    if (!this.isInScrollBar(gridPoint, grid)) {
      return false;
    }

    const mouseBarX = x - barLeft;
    if (mouseBarX >= scrollX && mouseBarX <= scrollX + handleWidth) {
      // Grabbed the horizontal handle
      this.dragOffset = mouseBarX - scrollX;
      grid.setState({ isDraggingHorizontalScrollBar: true });
    } else {
      this.dragOffset = 0;

      const { left: newLeft, leftOffset: newLeftOffset } =
        this.getLeftWithOffset(gridPoint, grid);

      grid.setViewState({
        left: newLeft,
        leftOffset: newLeftOffset,
        isDraggingHorizontalScrollBar: true,
        isDragging: true,
      });
    }

    return true;
  }

  onDrag(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.dragOffset != null) {
      const { left: newLeft, leftOffset: newLeftOffset } =
        this.getLeftWithOffset(gridPoint, grid);

      grid.setViewState({
        left: newLeft,
        leftOffset: newLeftOffset,
        isDraggingHorizontalScrollBar: true,
        isDragging: true,
      });

      return true;
    }
    return false;
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.isInScrollBar(gridPoint, grid);
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.dragOffset !== undefined) {
      this.dragOffset = undefined;
      grid.setState({
        isDraggingHorizontalScrollBar: false,
        isDragging: false,
      });
    }

    return this.isInScrollBar(gridPoint, grid);
  }

  onClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.isInScrollBar(gridPoint, grid);
  }
}

export default GridHorizontalScrollBarMouseHandler;
