/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
} from '@deephaven/grid';
import type { IrisGrid } from '../IrisGrid';

/**
 * Trigger quick filters and advanced filters
 */
class IrisGridFilterMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
  }

  irisGrid: IrisGrid;

  onDown(gridPoint: GridPoint): EventHandlerResult {
    const { y, column, row } = gridPoint;
    if (column !== null && row === null) {
      const { isFilterBarShown, metrics } = this.irisGrid.state;
      if (!metrics) throw new Error('Metrics not set');

      const { columnHeaderMaxDepth } = metrics;
      const theme = this.irisGrid.getTheme();
      if (
        isFilterBarShown &&
        theme.columnHeaderHeight &&
        theme.filterBarHeight &&
        y > theme.columnHeaderHeight * columnHeaderMaxDepth &&
        y <=
          theme.columnHeaderHeight * columnHeaderMaxDepth +
            theme.filterBarHeight
      ) {
        this.irisGrid.focusFilterBar(column);
        return true;
      }
    }

    return false;
  }

  onMove(gridPoint: GridPoint): EventHandlerResult {
    const { y, column } = gridPoint;
    const {
      isFilterBarShown,
      hoverAdvancedFilter,
      metrics,
    } = this.irisGrid.state;
    if (!metrics) throw new Error('Metrics not set');
    const { columnHeaderMaxDepth } = metrics;
    const theme = this.irisGrid.getTheme();

    let newHoverAdvancedFilter = null;
    if (
      isFilterBarShown &&
      theme.columnHeaderHeight &&
      theme.filterBarHeight &&
      column !== null &&
      y >= theme.columnHeaderHeight * columnHeaderMaxDepth &&
      y <=
        theme.columnHeaderHeight * columnHeaderMaxDepth + theme.filterBarHeight
    ) {
      newHoverAdvancedFilter = column;
    }

    if (newHoverAdvancedFilter !== hoverAdvancedFilter) {
      this.irisGrid.setState({ hoverAdvancedFilter: newHoverAdvancedFilter });
    }

    return false;
  }

  onLeave(gridPoint: GridPoint): EventHandlerResult {
    const { column } = gridPoint;
    const { hoverAdvancedFilter } = this.irisGrid.state;
    if (hoverAdvancedFilter !== null && column !== hoverAdvancedFilter) {
      this.irisGrid.setState({ hoverAdvancedFilter: null });
    }

    return false;
  }
}

export default IrisGridFilterMouseHandler;
