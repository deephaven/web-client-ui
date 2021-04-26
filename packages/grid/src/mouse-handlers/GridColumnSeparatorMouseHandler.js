/* eslint class-methods-use-this: "off" */
import GridUtils from '../GridUtils';
import GridSeparatorMouseHandler from './GridSeparatorMouseHandler';

class GridColumnSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getColumnSeparatorIndex(gridPoint, grid, checkAllowResize = true) {
    const theme = grid.getTheme();
    if (checkAllowResize && !theme.allowColumnResize) {
      return null;
    }

    const { x, y } = gridPoint;
    const { metrics } = grid;

    return GridUtils.getColumnSeparatorIndex(x, y, metrics, theme);
  }

  hiddenCursor = 'e-resize';

  defaultCursor = 'col-resize';

  pointProperty = 'x';

  userSizesProperty = 'userColumnWidths';

  visibleOffsetProperty = 'visibleColumnXs';

  visibleSizesProperty = 'visibleColumnWidths';

  marginProperty = 'rowHeaderWidth';

  calculatedSizesProperty = 'calculatedColumnWidths';

  modelIndexesProperty = 'modelColumns';

  firstIndexProperty = 'firstColumn';

  treePaddingProperty = 'treePaddingX';

  getHiddenItems = GridUtils.getHiddenColumns;

  getNextShownItem = GridUtils.getNextShownColumn;

  setSize(metricCalculator, modelIndex, size) {
    metricCalculator.setColumnWidth(modelIndex, size);
  }

  resetSize(metricCalculator, modelIndex) {
    metricCalculator.resetColumnWidth(modelIndex);
  }

  updateSeparator(grid, separatorIndex) {
    grid.setState({
      draggingColumnSeparator: separatorIndex,
      isDragging: !!separatorIndex,
    });
  }

  getSeparatorIndex = GridColumnSeparatorMouseHandler.getColumnSeparatorIndex;
}

export default GridColumnSeparatorMouseHandler;
