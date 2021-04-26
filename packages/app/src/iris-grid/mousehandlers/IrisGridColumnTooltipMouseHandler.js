/* eslint class-methods-use-this: "off" */
import { GridMouseHandler } from '@deephaven/grid';

/**
 * Detects mouse hover over column headers and displays the appropriate tooltip
 */
class IrisGridColumnTooltipMouseHandler extends GridMouseHandler {
  constructor(irisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  destroyColumnTooltip() {
    const { shownColumnTooltip } = this.irisGrid.state;
    if (shownColumnTooltip != null) {
      this.irisGrid.setState({ shownColumnTooltip: null });
    }
  }

  hideColumnTooltip() {
    const { tooltip } = this.irisGrid;
    if (tooltip) {
      tooltip.stopTimer();
      tooltip.hide();
    }
  }

  onDown() {
    this.hideColumnTooltip();
    return false;
  }

  onContextMenu() {
    this.hideColumnTooltip();
    return false;
  }

  onMove(gridPoint) {
    const { y, column, row } = gridPoint;
    const { shownColumnTooltip } = this.irisGrid.state;
    const theme = this.irisGrid.getTheme();
    let newTooltip = null;
    if (column !== null && row === null) {
      if (y >= 0 && y <= theme.columnHeaderHeight - 2) {
        // -2 account for borders
        newTooltip = column;
      }
    }

    if (newTooltip !== shownColumnTooltip) {
      this.irisGrid.setState({ shownColumnTooltip: newTooltip });
    }

    return false;
  }

  onLeave(gridPoint) {
    const { y } = gridPoint;
    if (y < 0) {
      this.destroyColumnTooltip();
    }
    return false;
  }
}

export default IrisGridColumnTooltipMouseHandler;
