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
    let columnWidth = metrics.visibleColumnWidths.get(left);
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
    const { lastLeft, lastTop, rowHeaderWidth, width, height } = metrics;
    const scrollBarWidth = lastTop > 0 ? width - scrollBarSize : width;
    return (
      scrollBarSize > 0 &&
      lastLeft > 0 &&
      y >= height - scrollBarHoverSize &&
      y < height &&
      x > rowHeaderWidth &&
      x < scrollBarWidth
    );
  }

  onDown(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { x } = gridPoint;
    const {
      barWidth,
      handleWidth,
      lastLeft,
      rowHeaderWidth,
      scrollX,
    } = metrics;
    if (!this.isInScrollBar(gridPoint, grid)) {
      return false;
    }

    const mouseBarX = x - rowHeaderWidth;
    if (mouseBarX >= scrollX && mouseBarX <= scrollX + handleWidth) {
      // Grabbed the horizontal handle
      this.dragOffset = mouseBarX - scrollX;
      grid.setState({ isDraggingHorizontalScrollBar: true });
    } else {
      this.dragOffset = 0;
      const rawLeft = Math.min(
        Math.max(0, (mouseBarX / (barWidth - handleWidth)) * lastLeft),
        lastLeft
      );

      const {
        left: newLeft,
        leftOffset: newLeftOffset,
      } = GridHorizontalScrollBarMouseHandler.getLeftWithOffsetFromRawLeft(
        grid,
        rawLeft
      );
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
      const { x } = gridPoint;
      const { metrics } = grid;
      if (!metrics) throw new Error('metrics not set');

      const { barWidth, handleWidth, lastLeft, rowHeaderWidth } = metrics;
      const mouseBarX = x - rowHeaderWidth;

      const rawLeft = Math.min(
        Math.max(
          0,
          ((mouseBarX - this.dragOffset) / (barWidth - handleWidth)) * lastLeft
        ),
        lastLeft
      );

      const {
        left: newLeft,
        leftOffset: newLeftOffset,
      } = GridHorizontalScrollBarMouseHandler.getLeftWithOffsetFromRawLeft(
        grid,
        rawLeft
      );
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
