/* eslint class-methods-use-this: "off" */
import GridUtils from '../GridUtils';
import Grid from '../Grid';
import GridRange from '../GridRange';
import KeyHandler from '../KeyHandler';

class EditKeyHandler extends KeyHandler {
  onDown(e: KeyboardEvent, grid: Grid): boolean {
    if (GridUtils.isModifierKeyDown(e)) {
      return false;
    }

    const { model } = grid.props;
    const { cursorColumn, cursorRow } = grid.state;
    if (
      cursorColumn == null ||
      cursorRow == null ||
      !model.isEditableRange(GridRange.makeCell(cursorColumn, cursorRow))
    ) {
      return false;
    }
    const column: number | null = cursorColumn;
    const row: number | null = cursorRow;
    if (column == null || row == null) {
      return false;
    }

    if (e.key.length === 1) {
      grid.startEditing(column, row, true, [1, 1], e.key);
      return true;
    }

    if (e.key === 'F2') {
      grid.startEditing(column, row);
      return true;
    }

    if (e.key === 'Backspace') {
      grid.startEditing(column, row, true, null, '');
      return true;
    }

    if (e.key === 'Delete') {
      grid.setValueForCell(column, row, '');
      return true;
    }
    return false;
  }
}

export default EditKeyHandler;
