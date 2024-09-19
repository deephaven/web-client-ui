/* eslint class-methods-use-this: "off" */
import {
  type Grid,
  GridMouseHandler,
  type GridPoint,
  type EventHandlerResult,
} from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';
import { isPartitionedGridModel } from '../PartitionedGridModel';

/**
 * Handles sending data selected via double click
 */
class IrisGridPartitionedTableMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super(878);

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDoubleClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { column, row } = gridPoint;
    const { irisGrid } = this;
    const { model } = irisGrid.props;
    const { partitionConfig } = irisGrid.state;

    if (
      row == null ||
      column == null ||
      !isPartitionedGridModel(model) ||
      partitionConfig == null ||
      partitionConfig.mode !== 'keys'
    ) {
      return false;
    }

    this.irisGrid.selectPartitionKeyFromTable(row);

    return true;
  }
}

export default IrisGridPartitionedTableMouseHandler;
