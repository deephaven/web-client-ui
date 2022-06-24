/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridMetricCalculator from '../GridMetricCalculator';
import { ModelIndex, VisibleIndex } from '../GridMetrics';
import GridUtils, { GridPoint } from '../GridUtils';
import GridSeparatorMouseHandler, {
  GridSeparator,
} from './GridSeparatorMouseHandler';

class GridRowSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getRowSeparator(
    gridPoint: GridPoint,
    grid: Grid,
    checkAllowResize = true
  ): GridSeparator | null {
    const theme = grid.getTheme();
    if (checkAllowResize && !theme.allowRowResize) {
      return null;
    }

    const { x, y } = gridPoint;
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    const index = GridUtils.getRowSeparatorIndex(x, y, metrics, theme);

    return index != null ? { index, depth: 0 } : null;
  }

  hiddenCursor = 's-resize';

  defaultCursor = 'row-resize';

  pointProperty = 'y' as const;

  userSizesProperty = 'userRowHeights' as const;

  visibleOffsetProperty = 'visibleRowYs' as const;

  visibleSizesProperty = 'visibleRowHeights' as const;

  marginProperty = 'columnHeaderHeight' as const;

  calculatedSizesProperty = 'calculatedRowHeights' as const;

  modelIndexesProperty = 'modelRows' as const;

  firstIndexProperty = 'firstRow' as const;

  treePaddingProperty = 'treePaddingY' as const;

  getHiddenItems = GridUtils.getHiddenRows;

  getNextShownItem = GridUtils.getNextShownRow;

  setSize(
    metricCalculator: GridMetricCalculator,
    modelIndex: ModelIndex,
    size: number
  ): void {
    metricCalculator.setRowHeight(modelIndex, size);
  }

  resetSize(
    metricCalculator: GridMetricCalculator,
    modelIndex: ModelIndex
  ): void {
    metricCalculator.resetRowHeight(modelIndex);
  }

  updateSeparator(grid: Grid, separator: GridSeparator | null): void {
    grid.setState({
      draggingRowSeparator: separator,
      isDragging: separator !== null,
    });
  }

  getSeparator = GridRowSeparatorMouseHandler.getRowSeparator;
}

export default GridRowSeparatorMouseHandler;
