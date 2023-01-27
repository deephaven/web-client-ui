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
      allColumnXs,
      allColumnWidths,
      allRowHeights,
      allRowYs,
      visibleRowTreeBoxes,
    } = metrics;

    if (
      column === firstColumn &&
      row != null &&
      visibleRowTreeBoxes.get(row) != null &&
      x > gridX &&
      y > gridY
    ) {
      const columnX = getOrThrow(allColumnXs, column);
      const width = getOrThrow(allColumnWidths, column);
      const rowY = getOrThrow(allRowYs, row);
      const height = getOrThrow(allRowHeights, row);
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

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: React.MouseEvent
  ): EventHandlerResult {
    if (GridRowTreeMouseHandler.isInTreeBox(gridPoint, grid)) {
      const { row } = gridPoint;
      if (row !== null) {
        grid.toggleRowExpanded(row, event.ctrlKey || event.metaKey);
        return true;
      }
    }
    return false;
  }
}

export default GridRowTreeMouseHandler;
