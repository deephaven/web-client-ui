/* eslint class-methods-use-this: "off" */
import { GridMouseHandler } from '@deephaven/grid';

/**
 * Handles sending data selected via double click
 */
class IrisGridDataSelectMouseHandler extends GridMouseHandler {
  constructor(irisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDoubleClick(gridPoint) {
    const { column, row } = gridPoint;
    if (row == null || column == null) {
      return false;
    }

    this.irisGrid.selectData(column, row);

    return true;
  }
}

export default IrisGridDataSelectMouseHandler;
