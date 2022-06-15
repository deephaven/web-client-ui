/* eslint class-methods-use-this: "off" */
import {
  Grid,
  GridMouseHandler,
  GridPoint,
  GridUtils,
  GridWheelEvent,
  isEditableGridModel,
} from '@deephaven/grid';
import IrisGrid, { assertNotUndefined } from '../IrisGrid';

/**
 * Handles sending data selected via double click
 */

interface PendingMouseHandler {
  irisGrid: IrisGrid;
}
class PendingMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onWheel(gridPoint: GridPoint, grid: Grid, wheelEvent: GridWheelEvent): false {
    const { irisGrid } = this;
    const { model } = irisGrid.props;
    const { metrics, pendingRowCount } = irisGrid.state;
    assertNotUndefined(metrics);
    const { bottom, rowCount, rowHeight } = metrics;
    const { deltaY } = GridUtils.getScrollDelta(wheelEvent);
    if (
      isEditableGridModel(model) &&
      model.isEditable &&
      bottom >= rowCount - 1 &&
      deltaY > 0
    ) {
      // We add new rows onto the bottom, but we don't consume the event
      irisGrid.setState({
        pendingRowCount: pendingRowCount + Math.ceil(deltaY / rowHeight),
      });
    }
    return false;
  }
}

export default PendingMouseHandler;
