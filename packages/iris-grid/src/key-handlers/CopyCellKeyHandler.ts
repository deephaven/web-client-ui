import { KeyboardEvent } from 'react';
import { KeyHandler } from '@deephaven/grid';
import { ContextActionUtils } from '@deephaven/components';
import type { Grid } from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';

class CopyCellKeyHandler extends KeyHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
    this.cursor = null;
  }

  onDown(event: KeyboardEvent, grid: Grid): boolean {
    if (
      event.altKey &&
      !ContextActionUtils.isModifierKeyDown(event) &&
      !event.shiftKey
    ) {
      const { mouseX, mouseY } = grid.state;
      if (mouseX == null || mouseY == null) {
        return false;
      }
      const gridPoint = grid.getGridPointFromXY(mouseX, mouseY);
      if (gridPoint.column != null && gridPoint.row != null) {
        this.cursor = this.irisGrid.props.copyCursor;
        return true;
      }
    }
    return false;
  }

  onUp(event: KeyboardEvent, grid: Grid): boolean {
    if (this.cursor === this.irisGrid.props.copyCursor) {
      this.cursor = null;
      return true;
    }
    return false;
  }
}

export default CopyCellKeyHandler;
