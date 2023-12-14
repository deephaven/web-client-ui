/* eslint class-methods-use-this: "off" */
import { KeyboardEvent } from 'react';
import { KeyHandler } from '@deephaven/grid';
import { ContextActionUtils } from '@deephaven/components';
import { IrisGrid } from '../IrisGrid';

class CopyCursorKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDown(event: KeyboardEvent): boolean {
    if (ContextActionUtils.isModifierKeyDown(event) || event.shiftKey) {
      this.irisGrid.handleHideCopyCursor();
    } else if (event.altKey) {
      this.irisGrid.handleShowCopyCursor();
    }
    return false;
  }

  onUp(event: KeyboardEvent): boolean {
    if (event.key === 'Alt') {
      this.irisGrid.handleHideCopyCursor();
    }
    return false;
  }
}

export default CopyCursorKeyHandler;
