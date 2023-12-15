import {
  Grid,
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
  GridMouseEvent,
} from '@deephaven/grid';
import { ContextActionUtils } from '@deephaven/components';
import IrisGrid from '../IrisGrid';

class IrisGridCopyCellMouseHandler extends GridMouseHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
    this.cursor = null;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    if (
      event.altKey &&
      !ContextActionUtils.isModifierKeyDown(event) &&
      !event.shiftKey
    ) {
      this.cursor = null;
      if (gridPoint.columnHeaderDepth !== undefined) {
        this.irisGrid.copyColumnHeader(gridPoint.column);
      } else {
        this.irisGrid.copyCell(gridPoint.column, gridPoint.row);
      }
      return true;
    }
    return false;
  }

  onMove(
    gridPoint: GridPoint,
    _grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    if (
      event.altKey &&
      !ContextActionUtils.isModifierKeyDown(event) &&
      !event.shiftKey &&
      gridPoint.column != null &&
      (gridPoint.row != null || gridPoint.columnHeaderDepth != null)
    ) {
      this.cursor = this.irisGrid.props.copyCursor;
      return true;
    }
    return false;
  }
}
export default IrisGridCopyCellMouseHandler;
