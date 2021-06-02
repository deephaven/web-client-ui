/* eslint class-methods-use-this: "off" */
import { ContextActionUtils } from '@deephaven/components';
import { KeyHandler } from '@deephaven/grid';
import { IrisGrid } from '../IrisGrid';

class ClearFilterKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDown(e: KeyboardEvent): boolean {
    if (
      e.key.toLowerCase() === 'e' &&
      ContextActionUtils.isModifierKeyDown(e) &&
      e.shiftKey
    ) {
      this.irisGrid.clearAllFilters();
      return true;
    }
    return false;
  }
}

export default ClearFilterKeyHandler;
