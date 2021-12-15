/* eslint class-methods-use-this: "off" */
import GridUtils from '../GridUtils';
import Grid from '../Grid';
import GridRange from '../GridRange';
import KeyHandler, { GridKeyboardEvent } from '../KeyHandler';
import { isEditableGridModel } from '../EditableGridModel';
import { EventHandlerResult } from '../EventHandlerResult';

class EditKeyHandler extends KeyHandler {
  onDown(event: GridKeyboardEvent, grid: Grid): EventHandlerResult {
    if (GridUtils.isModifierKeyDown(event)) {
      return false;
    }

    const { model } = grid.props;
    const { cursorColumn, cursorRow } = grid.state;
    if (
      cursorColumn == null ||
      cursorRow == null ||
      !isEditableGridModel(model) ||
      !model.isEditableRange(GridRange.makeCell(cursorColumn, cursorRow))
    ) {
      return false;
    }
    const column: number | null = cursorColumn;
    const row: number | null = cursorRow;
    if (column == null || row == null) {
      return false;
    }

    if (event.key.length === 1) {
      grid.startEditing(column, row, true, [1, 1], event.key);
      return true;
    }

    if (event.key === 'F2') {
      grid.startEditing(column, row);
      return true;
    }

    if (event.key === 'Backspace') {
      grid.startEditing(column, row, true, undefined, '');
      return true;
    }

    if (event.key === 'Delete') {
      grid.setValueForCell(column, row, '');
      return true;
    }
    return false;
  }
}

export default EditKeyHandler;
