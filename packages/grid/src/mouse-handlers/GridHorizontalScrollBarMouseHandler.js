import GridMouseHandler from '../GridMouseHandler';

/* eslint class-methods-use-this: "off" */
class GridHorizontalScrollBarMouseHandler extends GridMouseHandler {
  dragOffset = null;

  // to trigger pointer event blocking
  cursor = 'default';

  isInScrollBar(gridPoint, grid) {
    const theme = grid.getTheme();

    const { scrollBarSize, scrollBarHoverSize } = theme;
    const { metrics } = grid;
    const { x, y } = gridPoint;
    const { lastLeft, rowHeaderWidth, width, height } = metrics;
    return (
      scrollBarSize > 0 &&
      lastLeft > 0 &&
      y >= height - scrollBarHoverSize &&
      y < height &&
      x > rowHeaderWidth &&
      x < width - scrollBarSize
    );
  }

  onDown(gridPoint, grid) {
    const { metrics } = grid;
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

  onDrag(gridPoint, grid) {
    if (this.dragOffset != null) {
      const { x } = gridPoint;
      const { metrics } = grid;
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

  onMove(gridPoint, grid) {
    return this.isInScrollBar(gridPoint, grid);
  }

  onUp(gridPoint, grid) {
    if (this.dragOffset != null) {
      this.dragOffset = null;
      grid.setState({
        isDraggingHorizontalScrollBar: false,
        isDragging: false,
      });
    }

    return this.isInScrollBar(gridPoint, grid);
  }

  onClick(gridPoint, grid) {
    return this.isInScrollBar(gridPoint, grid);
  }

  static getLeftWithOffsetFromRawLeft(grid, rawLeft) {
    const theme = grid.getTheme();
    const { metrics, metricCalculator } = grid;

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
}

export default GridHorizontalScrollBarMouseHandler;
