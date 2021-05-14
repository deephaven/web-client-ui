/* eslint class-methods-use-this: "off" */
import { ContextActionUtils } from '@deephaven/components';
import { KeyHandler } from '@deephaven/grid';
import { IrisGrid } from '../IrisGrid';
import IrisGridUtils from '../IrisGridUtils';

class CopyKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDown(e: KeyboardEvent): boolean {
    const { selectedRanges } = this.irisGrid.state;
    if (e.key === 'c' && ContextActionUtils.isModifierKeyDown(e)) {
      if (IrisGridUtils.isValidSnapshotRanges(selectedRanges)) {
        this.irisGrid.copyRanges(selectedRanges);
      } else {
        this.irisGrid.copyRanges(
          selectedRanges,
          false,
          false,
          'Invalid copy ranges'
        );
      }
      return true;
    }
    return false;
  }
}

export default CopyKeyHandler;
