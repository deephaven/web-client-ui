/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
  Grid,
  GridMouseEvent,
} from '@deephaven/grid';
import type { IrisGrid } from '../IrisGrid';

/**
 * Detects mouse hover over column headers and displays the appropriate tooltip
 */
class IrisGridColumnTooltipMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  private irisGrid: IrisGrid;

  private hideColumnTooltip(): void {
    const { tooltip } = this.irisGrid;
    if (tooltip) {
      tooltip.stopTimer();
      tooltip.hide();
    }
  }

  onDown(): EventHandlerResult {
    this.hideColumnTooltip();
    return false;
  }

  onContextMenu(): EventHandlerResult {
    this.hideColumnTooltip();
    return false;
  }

  onWheel(): EventHandlerResult {
    this.hideColumnTooltip();
    return false;
  }

  onLeave(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    /**
     * This should always be a react event
     * React seems to be handling onMouseLeave incorrectly at times
     * When moving to the padding between the column and popper, React sets
     * event.relatedTarget to window, but event.nativeEvent.relatedTarget is the popper.
     * It's possibly related to popper being rendered in a portal
     */
    const { relatedTarget } =
      event instanceof MouseEvent ? event : event.nativeEvent;

    const { tooltip } = this.irisGrid;
    if (!tooltip) {
      return false;
    }

    const popper = tooltip.popper.current;

    if (
      popper &&
      relatedTarget instanceof Element &&
      popper.element.contains(relatedTarget)
    ) {
      // Do not hide the popper if we moved the cursor from canvas to popper
      return false;
    }
    this.hideColumnTooltip();
    return false;
  }

  onMove(gridPoint: GridPoint): EventHandlerResult {
    const { y, column, row } = gridPoint;
    const { shownColumnTooltip } = this.irisGrid.state;
    const theme = this.irisGrid.getTheme();
    let newTooltip = null;
    if (column !== null && row === null) {
      /**
       * one would expect at y == theme.columnHeaderHeight, row == null
       * however, gridY also == theme.columnHeaderHeight, so row still has a value
       * so this tooltip won't actually show until row is null at columnHeaderHeight - 1
       */
      if (theme.columnHeaderHeight && y >= 0 && y <= theme.columnHeaderHeight) {
        newTooltip = column;
      }
    }

    if (newTooltip !== shownColumnTooltip) {
      this.irisGrid.setState({ shownColumnTooltip: newTooltip });
    }

    return false;
  }
}

export default IrisGridColumnTooltipMouseHandler;
