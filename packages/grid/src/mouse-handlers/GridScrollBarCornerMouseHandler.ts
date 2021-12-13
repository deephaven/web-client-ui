/* eslint class-methods-use-this: "off" */
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridMouseHandler from '../GridMouseHandler';
import { GridPoint } from '../GridUtils';

/**
 * Used to eat the mouse event in the bottom right corner of the scroll bar
 */
class GridScrollBarCornerMouseHandler extends GridMouseHandler {
  isInCorner(gridPoint: GridPoint, grid: Grid): boolean {
    const theme = grid.getTheme();
    const { scrollBarSize } = theme;
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const { x, y } = gridPoint;
    const { lastLeft, lastTop, width, height } = metrics;
    return (
      scrollBarSize > 0 &&
      lastTop > 0 &&
      lastLeft > 0 &&
      x >= width - scrollBarSize &&
      y >= height - scrollBarSize &&
      x <= width &&
      y <= height
    );
  }

  onDown(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.isInCorner(gridPoint, grid);
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.isInCorner(gridPoint, grid);
  }

  onClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.isInCorner(gridPoint, grid);
  }
}

export default GridScrollBarCornerMouseHandler;
