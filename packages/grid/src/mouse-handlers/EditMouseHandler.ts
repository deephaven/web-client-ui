/* eslint class-methods-use-this: "off" */
import { isEditableGridModel } from '../EditableGridModel';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridMouseHandler from '../GridMouseHandler';
import GridRange from '../GridRange';
import { GridPoint } from '../GridUtils';

/**
 * Handles clicking on a cell to edit it in an editable grid
 */
class EditMouseHandler extends GridMouseHandler {
  onDoubleClick({ column, row }: GridPoint, grid: Grid): EventHandlerResult {
    const { model } = grid.props;
    if (
      isEditableGridModel(model) &&
      column != null &&
      row != null &&
      model.isEditableRange(GridRange.makeCell(column, row))
    ) {
      grid.startEditing(column, row);
      return true;
    }
    return false;
  }
}

export default EditMouseHandler;
