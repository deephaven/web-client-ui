/* eslint class-methods-use-this: "off" */
import GridUtils from '../GridUtils';
import type Grid from '../Grid';
import GridRange from '../GridRange';
import KeyHandler, { type GridKeyboardEvent } from '../KeyHandler';
import { isEditableGridModel } from '../EditableGridModel';
import { type EventHandlerResult } from '../EventHandlerResult';

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
      !isEditableGridModel(model)
    ) {
      return false;
    }

    let modelColumn: number;
    let modelRow: number;
    try {
      modelColumn = grid.getModelColumn(cursorColumn);
      modelRow = grid.getModelRow(cursorRow);
    } catch {
      return false;
    }

    if (!model.isEditableRange(GridRange.makeCell(modelColumn, modelRow))) {
      return false;
    }

    if (event.key.length === 1) {
      // If the renderer for this cell's restriction type preserves the existing
      // value on keystroke (e.g. a dropdown), open the editor without replacing.
      const { cellInputRendererRegistry } = grid.props;
      const restrictions = model.getColumnRestrictions(modelColumn);
      if (restrictions.length === 1) {
        const renderer = cellInputRendererRegistry?.get(restrictions[0].type);
        if (renderer?.preservesExistingValue === true) {
          grid.startEditing(cursorColumn, cursorRow);
          return true;
        }
      }
      grid.startEditing(cursorColumn, cursorRow, true, [1, 1], event.key);
      return true;
    }

    if (event.key === 'F2') {
      grid.startEditing(cursorColumn, cursorRow);
      return true;
    }

    if (event.key === 'Enter') {
      grid.startEditing(cursorColumn, cursorRow);
      return true;
    }

    if (event.key === 'Backspace') {
      grid.startEditing(cursorColumn, cursorRow, true, undefined, '');
      return true;
    }

    if (event.key === 'Delete') {
      grid.setValueForCell(cursorColumn, cursorRow, '');
      return true;
    }
    return false;
  }
}

export default EditKeyHandler;
