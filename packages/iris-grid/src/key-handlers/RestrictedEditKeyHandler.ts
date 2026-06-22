import { type KeyboardEvent } from 'react';
import {
  KeyHandler,
  type Grid,
  isEditableGridModel,
  GridRange,
} from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';
import { DEFAULT_REGISTRY } from '../CellInputRendererContext';

/**
 * Key handler that intercepts printable-character keystrokes on cells whose
 * column restriction type has a registered custom renderer (e.g. a dropdown).
 *
 * For those cells, typing a character should open the editor with the existing
 * cell value preserved rather than replacing it with the typed character.
 * This handler runs at priority 390, just before EditKeyHandler (400), so it
 * takes precedence only when the column has a mapped renderer.
 */
class RestrictedEditKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super(390);
    this.irisGrid = irisGrid;
  }

  onDown(event: KeyboardEvent, grid: Grid): boolean {
    // Only intercept single printable characters — same guard as EditKeyHandler.
    if (event.key.length !== 1) {
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

    // Read the registry from context at call time (not construction time).
    const registry =
      this.irisGrid.context?.cellInputRendererRegistry ?? DEFAULT_REGISTRY;
    const modelColumn = grid.getModelColumn(cursorColumn);
    const restrictions = model.getColumnRestriction(modelColumn);
    if (restrictions.length === 1) {
      const renderer = registry.get(restrictions[0].type);
      if (renderer?.preservesExistingValue === true) {
        // Renderer has opted in — open editor without replacing the value.
        grid.startEditing(cursorColumn, cursorRow);
        return true;
      }
    }

    return false;
  }
}

export default RestrictedEditKeyHandler;
