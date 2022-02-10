/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
} from '@deephaven/grid';
import type { IrisGrid } from '../IrisGrid';

/**
 * Handles sending data selected via double click
 */
class IrisGridDataSelectMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDoubleClick(gridPoint: GridPoint): EventHandlerResult {
    const { column, row } = gridPoint;
    if (row == null || column == null) {
      return false;
    }

    this.irisGrid.selectData(column, row);

    return true;
  }
}

export default IrisGridDataSelectMouseHandler;
