/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridMetricCalculator from '../GridMetricCalculator';
import { ModelIndex } from '../GridMetrics';
import GridUtils, { GridPoint } from '../GridUtils';
import GridSeparatorMouseHandler, {
  GridSeparator,
} from './GridSeparatorMouseHandler';

class GridColumnSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getColumnSeparator(
    gridPoint: GridPoint,
    grid: Grid,
    checkAllowResize = true
  ): GridSeparator | null {
    const theme = grid.getTheme();
    if (checkAllowResize && !theme.allowColumnResize) {
      return null;
    }

    const { x, y, columnHeaderDepth } = gridPoint;
    const { metrics, props } = grid;
    const { model } = props;
    if (!metrics) throw new Error('metrics not set');

    const { modelColumns } = metrics;

    const separatorIndex = GridUtils.getColumnSeparatorIndex(
      x,
      y,
      metrics,
      theme
    );

    if (
      separatorIndex == null ||
      columnHeaderDepth == null ||
      columnHeaderDepth > 0
    ) {
      return null;
    }

    const columnIndex = modelColumns.get(separatorIndex);
    const nextColumnIndex = modelColumns.get(separatorIndex + 1);
    if (columnIndex == null || nextColumnIndex == null) {
      return null;
    }

    if (
      model.textForColumnHeader(columnIndex, columnHeaderDepth) !==
      model.textForColumnHeader(nextColumnIndex, columnHeaderDepth)
    ) {
      return { index: separatorIndex, depth: columnHeaderDepth };
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
