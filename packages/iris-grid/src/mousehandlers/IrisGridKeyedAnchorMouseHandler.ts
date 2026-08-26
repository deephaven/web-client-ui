import {
  type Grid,
  GridMouseHandler,
  type GridPoint,
  type EventHandlerResult,
  type GridMouseEvent,
} from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';

/**
 * On shift-click, refreshes the keyed-selection anchor before
 * GridSelectionMouseHandler (order 900) reads selectionStartRow, so the range
 * extends from the key's current visual position rather than the stale click row.
 */
class IrisGridKeyedAnchorMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super(850);
    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDown(
    _gridPoint: GridPoint,
    _grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    if (event.shiftKey) {
      this.irisGrid.refreshKeyedSelectionAnchor();
    }
    return false;
  }
}

export default IrisGridKeyedAnchorMouseHandler;
