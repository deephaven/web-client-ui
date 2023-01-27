/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridMetricCalculator from '../GridMetricCalculator';
import type { ModelIndex, GridMetrics } from '../GridMetrics';
import type GridModel from '../GridModel';
import { GridTheme } from '../GridTheme';
import GridUtils, { GridPoint } from '../GridUtils';
import GridSeparatorMouseHandler, {
  GridSeparator,
} from './GridSeparatorMouseHandler';

class GridRowSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getRowSeparator(
    gridPoint: GridPoint,
    metrics: GridMetrics,
    model: GridModel,
    theme: GridTheme
  ): GridSeparator | null {
    if (!theme.allowRowResize) {
      return null;
    }

    const { x, y } = gridPoint;

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

  initialSizesProperty = 'initialRowHeights' as const;

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
