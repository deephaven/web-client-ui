/* eslint class-methods-use-this: "off" */
import { ContextActionUtils } from '@deephaven/components';
import {
  Grid,
  GridMouseEvent,
  GridMouseHandler,
  GridPoint,
  GridRangeIndex,
  EventHandlerResult,
} from '@deephaven/grid';
import type { IrisGrid } from '../IrisGrid';

/**
 * Used to handle sorting on column header clicks
 */
class IrisGridSortMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.column = null;
    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  column: GridRangeIndex;

  getColumnFromGridPoint(gridPoint: GridPoint): GridRangeIndex {
    const { y, column, row } = gridPoint;
    if (column !== null && row === null) {
      const theme = this.irisGrid.getTheme();
      if (theme.columnHeaderHeight && y <= theme.columnHeaderHeight) {
        return column;
      }
    }

    return null;
  }

  // We need to remember where the down started, because the canvas element will trigger a click whereever mouseUp is
  onDown(gridPoint: GridPoint): EventHandlerResult {
    this.column = this.getColumnFromGridPoint(gridPoint);
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
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
