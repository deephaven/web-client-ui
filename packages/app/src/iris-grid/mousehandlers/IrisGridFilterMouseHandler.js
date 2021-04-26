/* eslint class-methods-use-this: "off" */
import { GridMouseHandler } from '@deephaven/grid';

/**
 * Trigger quick filters and advanced filters
 */
class IrisGridFilterMouseHandler extends GridMouseHandler {
  constructor(irisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  onDown(gridPoint) {
    const { y, column, row } = gridPoint;
    if (column !== null && row === null) {
      const { isFilterBarShown } = this.irisGrid.state;
      const theme = this.irisGrid.getTheme();
      if (
        isFilterBarShown &&
        y > theme.columnHeaderHeight &&
        y <= theme.columnHeaderHeight + theme.filterBarHeight
      ) {
        this.irisGrid.focusFilterBar(column);
        return true;
      }
    }

    return false;
  }

  onMove(gridPoint) {
    const { y, column } = gridPoint;
    const { isFilterBarShown, hoverAdvancedFilter } = this.irisGrid.state;
    const theme = this.irisGrid.getTheme();
    let newHoverAdvancedFilter = null;
    if (
      isFilterBarShown &&
      column !== null &&
      y >= theme.columnHeaderHeight &&
      y <= theme.columnHeaderHeight + theme.filterBarHeight
    ) {
      newHoverAdvancedFilter = column;
    }

    if (newHoverAdvancedFilter !== hoverAdvancedFilter) {
      this.irisGrid.setState({ hoverAdvancedFilter: newHoverAdvancedFilter });
    }

    return false;
  }

  onLeave(gridPoint) {
    const { column } = gridPoint;
    const { hoverAdvancedFilter } = this.irisGrid.state;
    if (hoverAdvancedFilter !== null && column !== hoverAdvancedFilter) {
      this.irisGrid.setState({ hoverAdvancedFilter: null });
    }
  }
}

export default IrisGridFilterMouseHandler;
