/* eslint class-methods-use-this: "off" */
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import { getOrThrow } from '../GridMetricCalculator';
import GridMouseHandler from '../GridMouseHandler';
import { GridPoint } from '../GridUtils';

/**
 * Detect when the tree expand/collapse button is clicked
 */
class GridRowTreeMouseHandler extends GridMouseHandler {
  static isInTreeBox(gridPoint: GridPoint, grid: Grid): boolean {
    const { column, row, x, y } = gridPoint;
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const {
      gridX,
      gridY,
      firstColumn,
      visibleColumnXs,
      visibleColumnWidths,
      visibleRowHeights,
      visibleRowYs,
      visibleRowTreeBoxes,
    } = metrics;

    if (
      column === firstColumn &&
      row != null &&
      visibleRowTreeBoxes.get(row) != null &&
      x > gridX &&
      y > gridY
    ) {
      const columnX = getOrThrow(visibleColumnXs, column);
      const width = getOrThrow(visibleColumnWidths, column);
      const rowY = getOrThrow(visibleRowYs, row);
      const height = getOrThrow(visibleRowHeights, row);
      if (
        x >= gridX + columnX &&
        x <= gridX + columnX + width &&
        y >= gridY + rowY &&
        y <= gridY + rowY + height
      ) {
        return true;
      }
    }
    return false;
  }

  onDown(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return GridRowTreeMouseHandler.isInTreeBox(gridPoint, grid);
  }

  onClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (GridRowTreeMouseHandler.isInTreeBox(gridPoint, grid)) {
      const { row } = gridPoint;
      if (row !== null) {
        grid.toggleRowExpanded(row);
        return true;
      }
    }
    return false;
  }
}

export default GridRowTreeMouseHandler;
