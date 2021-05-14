/* eslint class-methods-use-this: "off" */
import { GridMouseHandler, GridUtils } from '@deephaven/grid';

/**
 * Handles sending data selected via double click
 */
class PendingMouseHandler extends GridMouseHandler {
  constructor(irisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onWheel(gridPoint, grid, wheelEvent) {
    const { irisGrid } = this;
    const { model } = irisGrid.props;
    const { metrics, pendingRowCount } = irisGrid.state;
    const { bottom, rowCount, rowHeight } = metrics;
    const { deltaY } = GridUtils.getScrollDelta(wheelEvent);
    if (model.isEditable && bottom >= rowCount - 1 && deltaY > 0) {
      // We add new rows onto the bottom, but we don't consume the event
      irisGrid.setState({
        pendingRowCount: pendingRowCount + Math.ceil(deltaY / rowHeight),
      });
    }
    return false;
  }
}

export default PendingMouseHandler;
