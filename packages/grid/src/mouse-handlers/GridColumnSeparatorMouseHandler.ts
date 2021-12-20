/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridMetricCalculator from '../GridMetricCalculator';
import { ModelIndex, VisibleIndex } from '../GridMetrics';
import GridUtils, { GridPoint } from '../GridUtils';
import GridSeparatorMouseHandler from './GridSeparatorMouseHandler';

class GridColumnSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getColumnSeparatorIndex(
    gridPoint: GridPoint,
    grid: Grid,
    checkAllowResize = true
  ): VisibleIndex | null {
    const theme = grid.getTheme();
    if (checkAllowResize && !theme.allowColumnResize) {
      return null;
    }

    const { x, y } = gridPoint;
    const { metrics } = grid;
    if (!metrics) throw new Error('metrics not set');

    return GridUtils.getColumnSeparatorIndex(x, y, metrics, theme);
  }

  hiddenCursor = 'e-resize';

  defaultCursor = 'col-resize';

  pointProperty = 'x' as const;

  userSizesProperty = 'userColumnWidths' as const;

  visibleOffsetProperty = 'visibleColumnXs' as const;

  visibleSizesProperty = 'visibleColumnWidths' as const;

  marginProperty = 'rowHeaderWidth' as const;

  calculatedSizesProperty = 'calculatedColumnWidths' as const;

  modelIndexesProperty = 'modelColumns' as const;

  firstIndexProperty = 'firstColumn' as const;

  treePaddingProperty = 'treePaddingX' as const;

  getHiddenItems = GridUtils.getHiddenColumns;

  getNextShownItem = GridUtils.getNextShownColumn;

  setSize(
    metricCalculator: GridMetricCalculator,
    modelIndex: ModelIndex,
    size: number
  ): void {
    metricCalculator.setColumnWidth(modelIndex, size);
  }

  resetSize(
    metricCalculator: GridMetricCalculator,
    modelIndex: ModelIndex
  ): void {
    metricCalculator.resetColumnWidth(modelIndex);
  }

  updateSeparator(grid: Grid, separatorIndex: VisibleIndex | null): void {
    grid.setState({
      draggingColumnSeparator: separatorIndex,
      isDragging: separatorIndex !== null,
    });
  }

  getSeparatorIndex = GridColumnSeparatorMouseHandler.getColumnSeparatorIndex;
}

export default GridColumnSeparatorMouseHandler;
