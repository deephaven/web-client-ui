/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridMouseHandler from '../GridMouseHandler';
import GridRange from '../GridRange';

/**
 * Handles clicking on a cell to edit it in an editable grid
 */
class EditMouseHandler extends GridMouseHandler {
  onDoubleClick(
    { column, row }: { column: number; row: number },
    grid: Grid
  ): boolean {
    const { model } = grid.props;
    if (model.isEditableRange(GridRange.makeCell(column, row))) {
      grid.startEditing(column, row);
      return true;
    }
    return false;
  }
}

export default EditMouseHandler;
