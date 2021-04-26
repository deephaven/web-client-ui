import GridMouseHandler from '../GridMouseHandler';

/* eslint class-methods-use-this: "off" */
class GridVerticalScrollBarMouseHandler extends GridMouseHandler {
  dragOffset = null;

  // to trigger pointer event blocking
  cursor = 'default';

  isInScrollBar(gridPoint, grid) {
    const theme = grid.getTheme();

    const { scrollBarSize, scrollBarHoverSize } = theme;
    const { metrics } = grid;
    const { x, y } = gridPoint;
    const { lastTop, columnHeaderHeight, height, width } = metrics;
    return (
      scrollBarSize > 0 &&
      lastTop > 0 &&
      x >= width - scrollBarHoverSize &&
      x < width &&
      y > columnHeaderHeight &&
      y < height - scrollBarSize
    );
  }

  onDown(gridPoint, grid) {
    const { metrics } = grid;
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

  onMove(gridPoint, grid) {
    return this.isInScrollBar(gridPoint, grid);
  }

  onDrag(gridPoint, grid) {
    if (this.dragOffset != null) {
      const { y } = gridPoint;
      const { metrics } = grid;
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

  onUp(gridPoint, grid) {
    if (this.dragOffset != null) {
      this.dragOffset = null;
      grid.setState({ isDraggingVerticalScrollBar: false, isDragging: false });
    }

    return this.isInScrollBar(gridPoint, grid);
  }

  onClick(gridPoint, grid) {
    return this.isInScrollBar(gridPoint, grid);
  }

  static getTopWithOffsetFromRawTop(grid, rawTop) {
    const theme = grid.getTheme();
    const { metrics, metricCalculator } = grid;

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
}

export default GridVerticalScrollBarMouseHandler;
