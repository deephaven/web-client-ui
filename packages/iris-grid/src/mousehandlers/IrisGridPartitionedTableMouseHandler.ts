/* eslint class-methods-use-this: "off" */
import {
  type Grid,
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
} from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';
import { isPartitionedGridModel } from '../PartitionedGridModel';

/**
 * Handles sending data selected via double click
 */
class IrisGridPartitionedTableMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super(880);

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDoubleClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { column, row } = gridPoint;
    if (
      row == null ||
      column == null ||
      !isPartitionedGridModel(this.irisGrid.props.model)
    ) {
      return false;
    }

    this.irisGrid.setPartitionConfig(this.irisGrid.props.model, row);

    return true;
  }
}

export default IrisGridPartitionedTableMouseHandler;
