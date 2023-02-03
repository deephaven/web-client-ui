import {
  EventHandlerResult,
  Grid,
  GridMouseHandler,
  GridPoint,
  GridRowTreeMouseHandler,
  isExpandableGridModel,
} from '@deephaven/grid';
import deepEqual from 'deep-equal';
import type IrisGrid from '../IrisGrid';

class IrisGridRowTreeMouseHandler extends GridMouseHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super(750); // Needs to be before GridRowTreeMouseHandler

    this.irisGrid = irisGrid;
  }

  private destroyTooltip(): void {
    this.irisGrid.setState({ expandCellTooltipProps: null });
  }

  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (GridRowTreeMouseHandler.isInTreeBox(gridPoint, grid)) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }

    this.cursor = null;
    return false;
  }

  private getButtonPosition({
    x,
    y,
    column,
    row,
  }: GridPoint): {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null {
    if (column == null || row == null) {
      return null;
    }
    const { renderer, grid, state, props } = this.irisGrid;
    if (!grid) {
      return null;
    }
    const { metrics } = state;
    const { model } = props;

    const { canvasContext: context } = grid;
    const theme = grid.getTheme();
    const rendererState = {
      context,
      mouseX: x,
      mouseY: y,
      metrics,
      model,
      theme,
    };

    const depth = isExpandableGridModel(model) ? model.depthForRow(row) : null;

    const { left, top, width, height } = renderer.getExpandButtonPosition(
      rendererState,
      depth
    );
    if (left == null || width == null || top == null || height == null) {
      return null;
    }

    return { left, top, width, height };
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (GridRowTreeMouseHandler.isInTreeBox(gridPoint, grid)) {
      const { expandCellTooltipProps } = this.irisGrid.state;
      const newProps = this.getButtonPosition(gridPoint);
      if (!deepEqual(expandCellTooltipProps, newProps)) {
        this.irisGrid.setState({ expandCellTooltipProps: newProps });
      }
    } else {
      this.destroyTooltip();
    }
    return this.setCursor(gridPoint, grid);
  }

  onDown(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onContextMenu(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onWheel(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }

  onLeave(): EventHandlerResult {
    this.destroyTooltip();
    return false;
  }
}

export default IrisGridRowTreeMouseHandler;
