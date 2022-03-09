import {
  GridPoint,
  GridMouseHandler,
  EventHandlerResult,
} from '@deephaven/grid';
import type IrisGrid from '../IrisGrid';

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

  setCursor(point: GridPoint): EventHandlerResult {
    if (this.isHoveringOverflowButton(point)) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }

    this.cursor = null;
    return false;
  }

  onMove(point: GridPoint): EventHandlerResult {
    return this.setCursor(point);
  }

  onWheel(point: GridPoint): EventHandlerResult {
    return this.setCursor(point);
  }

  isHoveringOverflowButton({ x, y, column, row }: GridPoint): boolean {
    if (column == null || row == null) {
      return false;
    }
    const { renderer, grid, state, props } = this.irisGrid;
    if (!grid) {
      return false;
    }
    const { metrics } = state;
    const { model } = props;
    const { canvasContext: context } = grid || {};
    const theme = grid.getTheme();
    const rendererState = {
      context,
      mouseX: x,
      mouseY: y,
      metrics,
      model,
      theme,
    };

    const {
      left: buttonLeft,
      top: buttonTop,
      width: buttonWidth,
      height: buttonHeight,
    } = renderer.getCellOverflowButtonPosition(rendererState);

    if (
      buttonLeft == null ||
      buttonWidth == null ||
      buttonTop == null ||
      buttonHeight == null
    ) {
      return false;
    }

    return (
      renderer.shouldRenderOverflowButton(rendererState) &&
      x >= buttonLeft &&
      x <= buttonLeft + buttonWidth &&
      y >= buttonTop &&
      y <= buttonTop + buttonHeight
    );
  }

  // Needs to be onDown and not onClick b/c of GridSelectionMouseHandler shifting cell onDown
  onDown(point: GridPoint): boolean {
    const { column, row } = point;

    if (this.isHoveringOverflowButton(point))
      this.irisGrid.setState({
        showOverflowModal: true,
        overflowText: this.irisGrid.getValueForCell(column, row),
      });

    return false;
  }
}

export default IrisGridCellOverflowMouseHandler;
