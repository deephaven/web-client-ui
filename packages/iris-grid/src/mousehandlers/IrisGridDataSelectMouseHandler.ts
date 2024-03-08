/* eslint class-methods-use-this: "off" */
import {
  type Grid,
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
} from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';

/**
 * Handles sending data selected via double click
 */
class IrisGridDataSelectMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super(880);

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDoubleClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { column, row } = gridPoint;
    if (row == null || column == null) {
      return false;
    }

    this.irisGrid.selectData(column, row);

    return false;
  }
}

export default IrisGridDataSelectMouseHandler;
