/* eslint class-methods-use-this: "off" */
import { ContextActionUtils } from '@deephaven/components';
import { GridMouseHandler } from '@deephaven/grid';

/**
 * Used to handle sorting on column header clicks
 */
class IrisGridSortMouseHandler extends GridMouseHandler {
  constructor(irisGrid) {
    super();

    this.column = null;
    this.irisGrid = irisGrid;
  }

  getColumnFromGridPoint(gridPoint) {
    const { y, column, row } = gridPoint;
    if (column !== null && row === null) {
      const theme = this.irisGrid.getTheme();
      if (y <= theme.columnHeaderHeight) {
        return column;
      }
    }

    return null;
  }

  // We need to remember where the down started, because the canvas element will trigger a click whereever mouseUp is
  onDown(gridPoint) {
    this.column = this.getColumnFromGridPoint(gridPoint);
    return false;
  }

  onClick(gridPoint, grid, event) {
    const column = this.getColumnFromGridPoint(gridPoint);
    if (column != null && column === this.column) {
      const addToExisting = ContextActionUtils.isModifierKeyDown(event);
      this.irisGrid.toggleSort(column, addToExisting);
      return true;
    }

    return false;
  }
}

export default IrisGridSortMouseHandler;
