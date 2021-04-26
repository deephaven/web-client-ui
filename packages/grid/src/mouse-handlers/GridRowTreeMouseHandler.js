/* eslint class-methods-use-this: "off" */
import GridMouseHandler from '../GridMouseHandler';

/**
 * Detect when the tree expand/collapse button is clicked
 */
class GridRowTreeMouseHandler extends GridMouseHandler {
  static isInTreeBox(gridPoint, grid) {
    const { column, row, x, y } = gridPoint;
    const { metrics } = grid;
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
      const columnX = visibleColumnXs.get(column);
      const width = visibleColumnWidths.get(column);
      const rowY = visibleRowYs.get(row);
      const height = visibleRowHeights.get(row);
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

  onDown(gridPoint, grid) {
    return GridRowTreeMouseHandler.isInTreeBox(gridPoint, grid);
  }

  onClick(gridPoint, grid) {
    if (GridRowTreeMouseHandler.isInTreeBox(gridPoint, grid)) {
      const { row } = gridPoint;
      grid.toggleRowExpanded(row);
      return true;
    }
    return false;
  }
}

export default GridRowTreeMouseHandler;
