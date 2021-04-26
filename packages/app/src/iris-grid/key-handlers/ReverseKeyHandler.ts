/* eslint class-methods-use-this: "off" */
import { ContextActionUtils } from '@deephaven/components';
import { KeyHandler } from '@deephaven/grid';
import { IrisGrid } from '../IrisGrid';
import TableUtils from '../TableUtils';

class ReverseKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDown(e: KeyboardEvent): boolean {
    if (e.key === 'i' && ContextActionUtils.isModifierKeyDown(e)) {
      if (!this.irisGrid.isReversible()) {
        return false;
      }
      const { reverseType } = this.irisGrid.state;
      if (reverseType === TableUtils.REVERSE_TYPE.NONE) {
        this.irisGrid.reverse(TableUtils.REVERSE_TYPE.POST_SORT);
      } else {
        this.irisGrid.reverse(TableUtils.REVERSE_TYPE.NONE);
      }
      return true;
    }
    return false;
  }
}

export default ReverseKeyHandler;
