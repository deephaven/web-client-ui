/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridMetricCalculator from '../GridMetricCalculator';
import { ModelIndex, VisibleIndex } from '../GridMetrics';
import GridUtils, { GridPoint } from '../GridUtils';
import GridSeparatorMouseHandler, {
  CalculatedSizeProperty,
  FirstIndexProperty,
  MarginProperty,
  ModelIndexesProperty,
  PointProperty,
  TreePaddingProperty,
  UserSizeProperty,
  VisibleOffsetProperty,
  VisibleSizeProperty,
} from './GridSeparatorMouseHandler';

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

  pointProperty: PointProperty = 'x';

  userSizesProperty: UserSizeProperty = 'userColumnWidths';

  visibleOffsetProperty: VisibleOffsetProperty = 'visibleColumnXs';

  visibleSizesProperty: VisibleSizeProperty = 'visibleColumnWidths';

  marginProperty: MarginProperty = 'rowHeaderWidth';

  calculatedSizesProperty: CalculatedSizeProperty = 'calculatedColumnWidths';

  modelIndexesProperty: ModelIndexesProperty = 'modelColumns';

  firstIndexProperty: FirstIndexProperty = 'firstColumn';

  treePaddingProperty: TreePaddingProperty = 'treePaddingX';

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
      isDragging: !!separatorIndex,
    });
  }

  getSeparatorIndex = GridColumnSeparatorMouseHandler.getColumnSeparatorIndex;
}

export default GridColumnSeparatorMouseHandler;
