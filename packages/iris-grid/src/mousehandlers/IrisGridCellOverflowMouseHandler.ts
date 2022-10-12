import {
  GridPoint,
  GridMouseHandler,
  EventHandlerResult,
} from '@deephaven/grid';
import deepEqual from 'deep-equal';
import type IrisGrid from '../IrisGrid';
import { IrisGridRenderState } from '../IrisGridRenderer';

/**
 * Handles cursor and click action for cell overflow button
 * The button is rendered via IrisGridRenderer
 */
class IrisGridCellOverflowMouseHandler extends GridMouseHandler {
  private irisGrid: IrisGrid;

  constructor(irisGrid: IrisGrid) {
    super(850); // Needs to be before GridSelectionMouseHandler

    this.irisGrid = irisGrid;
  }

  private destroyColumnTooltip(): void {
    this.irisGrid.setState({ overflowButtonTooltipProps: null });
  }

  private setCursor(point: GridPoint): EventHandlerResult {
    if (this.isHoveringOverflowButton(point)) {
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

    const { left, top, width, height } = renderer.getCellOverflowButtonPosition(
      rendererState
    );
    if (left == null || width == null || top == null || height == null) {
      return null;
    }

    return { left, top, width, height };
  }

  private isHoveringOverflowButton(point: GridPoint): boolean {
    const { x, y } = point;
    const { left, top, width, height } = this.getButtonPosition(point) ?? {};
    if (left == null || width == null || top == null || height == null) {
      return false;
    }

    const { renderer, grid, state, props } = this.irisGrid;
    if (!grid) {
      return false;
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
    } as IrisGridRenderState;

    return (
      renderer.shouldRenderOverflowButton(rendererState) &&
      x >= left &&
      x <= left + width &&
      y >= top &&
      y <= top + height
    );
  }

  onMove(point: GridPoint): EventHandlerResult {
    if (this.isHoveringOverflowButton(point)) {
      const { overflowButtonTooltipProps } = this.irisGrid.state;
      const newProps = this.getButtonPosition(point);
      if (!deepEqual(overflowButtonTooltipProps, newProps)) {
        this.irisGrid.setState({ overflowButtonTooltipProps: newProps });
      }
    } else {
      this.destroyColumnTooltip();
    }
    return this.setCursor(point);
  }

  onWheel(point: GridPoint): EventHandlerResult {
    this.destroyColumnTooltip();
    return this.onMove(point);
  }

  // Needs to be onDown and not onClick b/c of GridSelectionMouseHandler shifting cell onDown
  onDown(point: GridPoint): boolean {
    this.destroyColumnTooltip();
    const { column, row } = point;

    if (this.isHoveringOverflowButton(point)) {
      this.irisGrid.setState({
        showOverflowModal: true,
        overflowText: this.irisGrid.getValueForCell(column, row) as string,
      });
    }

    return false;
  }

  onContextMenu(): EventHandlerResult {
    this.destroyColumnTooltip();
    return false;
  }

  onLeave(): EventHandlerResult {
    this.destroyColumnTooltip();
    return false;
  }
}

export default IrisGridCellOverflowMouseHandler;
