/* eslint class-methods-use-this: "off" */
import type Grid from '../Grid';
import type GridMetricCalculator from '../GridMetricCalculator';
import type { ModelIndex, GridMetrics } from '../GridMetrics';
import type GridModel from '../GridModel';
import type { GridTheme } from '../GridTheme';
import GridUtils, { type GridPoint } from '../GridUtils';
import GridSeparatorMouseHandler, {
  type GridSeparator,
} from './GridSeparatorMouseHandler';

class GridColumnSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getColumnSeparator(
    gridPoint: GridPoint,
    metrics: GridMetrics,
    model: GridModel,
    theme: GridTheme
  ): GridSeparator | null {
    if (!theme.allowColumnResize) {
      return null;
    }

    const { x, y, columnHeaderDepth: depth } = gridPoint;

    const { modelColumns } = metrics;

    const separatorIndex = GridUtils.getColumnSeparatorIndex(
      x,
      y,
      metrics,
      theme,
      model
    );

    if (separatorIndex == null || depth == null) {
      return null;
    }

    const columnIndex = modelColumns.get(separatorIndex);
    if (columnIndex != null) {
      return { index: separatorIndex, depth };
    }

    return null;
  }

  hiddenCursor = 'e-resize';

  defaultCursor = 'col-resize';

  pointProperty = 'x' as const;

  userSizesProperty = 'userColumnWidths' as const;

  visibleOffsetProperty = 'visibleColumnXs' as const;

  visibleSizesProperty = 'visibleColumnWidths' as const;

  marginProperty = 'rowHeaderWidth' as const;

  calculatedSizesProperty = 'calculatedColumnWidths' as const;

  initialSizesProperty = 'initialColumnWidths' as const;

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

  updateSeparator(grid: Grid, separator: GridSeparator | null): void {
    grid.setState({
      draggingColumnSeparator: separator,
      isDragging: separator !== null,
    });
  }

  getSeparator = GridColumnSeparatorMouseHandler.getColumnSeparator;
}

export default GridColumnSeparatorMouseHandler;
