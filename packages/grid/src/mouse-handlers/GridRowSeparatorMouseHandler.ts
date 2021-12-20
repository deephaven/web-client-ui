/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridMetricCalculator from '../GridMetricCalculator';
import { ModelIndex, VisibleIndex } from '../GridMetrics';
import GridUtils, { GridPoint } from '../GridUtils';
import GridSeparatorMouseHandler from './GridSeparatorMouseHandler';

class GridRowSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getRowSeparatorIndex(
    gridPoint: GridPoint,
    grid: Grid,
    checkAllowResize = true
  ): VisibleIndex | null {
    const theme = grid.getTheme();
    if (checkAllowResize && !theme.allowRowResize) {
      return null;
    }

    const { x, y } = gridPoint;
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    return GridUtils.getRowSeparatorIndex(x, y, metrics, theme);
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

  updateSeparator(grid: Grid, separatorIndex: VisibleIndex | null): void {
    grid.setState({
      draggingRowSeparator: separatorIndex,
      isDragging: separatorIndex !== null,
    });
  }

  getSeparatorIndex = GridRowSeparatorMouseHandler.getRowSeparatorIndex;
}

export default GridRowSeparatorMouseHandler;
