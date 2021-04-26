/* eslint class-methods-use-this: "off" */
import GridMouseHandler from '../GridMouseHandler';

/**
 * Used to eat the mouse event in the bottom right corner of the scroll bar
 */
class GridScrollBarCornerMouseHandler extends GridMouseHandler {
  isInCorner(gridPoint, grid) {
    const theme = grid.getTheme();
    const { scrollBarSize } = theme;
    const { metrics } = grid;
    const { x, y } = gridPoint;
    const { lastLeft, lastTop, width, height } = metrics;
    return (
      scrollBarSize > 0 &&
      (lastTop > 0 || lastLeft > 0) &&
      x >= width - scrollBarSize &&
      y >= height - scrollBarSize &&
      x <= width &&
      y <= height
    );
  }

  onDown(gridPoint, grid) {
    return this.isInCorner(gridPoint, grid);
  }

  onUp(gridPoint, grid) {
    return this.isInCorner(gridPoint, grid);
  }

  onClick(gridPoint, grid) {
    return this.isInCorner(gridPoint, grid);
  }
}

export default GridScrollBarCornerMouseHandler;
