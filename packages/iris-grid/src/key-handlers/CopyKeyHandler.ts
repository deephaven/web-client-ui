/* eslint class-methods-use-this: "off" */
import { type KeyboardEvent } from 'react';
import { ContextActionUtils } from '@deephaven/components';
import { isRangedSelection, KeyHandler } from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';
import IrisGridUtils from '../IrisGridUtils';

class CopyKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDown(event: KeyboardEvent): boolean {
    if (event.key === 'c' && ContextActionUtils.isModifierKeyDown(event)) {
      const { gridSelection } = this.irisGrid.state;
      if (gridSelection != null && !gridSelection.isEmpty()) {
        if (
          isRangedSelection(gridSelection) &&
          !IrisGridUtils.isValidSnapshotRanges(gridSelection.toRanges())
        ) {
          this.irisGrid.copySelection(
            gridSelection,
            false,
            false,
            'Invalid copy ranges'
          );
        } else {
          this.irisGrid.copySelection(gridSelection);
        }
      }
      return true;
    }
    return false;
  }
}

export default CopyKeyHandler;
