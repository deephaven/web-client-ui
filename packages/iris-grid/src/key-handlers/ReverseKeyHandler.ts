import { type KeyboardEvent } from 'react';
import { KeyHandler } from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';
import IrisGridShortcuts from '../IrisGridShortcuts';

class ReverseKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDown(event: KeyboardEvent): boolean {
    if (IrisGridShortcuts.TABLE.REVERSE.matchesEvent(event)) {
      if (!this.irisGrid.isReversible()) {
        return false;
      }
      const { reverse } = this.irisGrid.state;
      this.irisGrid.reverse(!reverse);
      return true;
    }
    return false;
  }
}

export default ReverseKeyHandler;
