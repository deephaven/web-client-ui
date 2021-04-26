/* eslint class-methods-use-this: "off" */
import GridUtils from '../GridUtils';
import GridSeparatorMouseHandler from './GridSeparatorMouseHandler';

class GridRowSeparatorMouseHandler extends GridSeparatorMouseHandler {
  static getRowSeparatorIndex(gridPoint, grid, checkAllowResize = true) {
    const theme = grid.getTheme();
    if (checkAllowResize && !theme.allowRowResize) {
      return null;
    }

    const { x, y } = gridPoint;
    const { metrics } = grid;

    return GridUtils.getRowSeparatorIndex(x, y, metrics, theme);
  }

  hiddenCursor = 's-resize';

  defaultCursor = 'row-resize';

  pointProperty = 'y';

  userSizesProperty = 'userRowHeights';

  visibleOffsetProperty = 'visibleRowYs';

  visibleSizesProperty = 'visibleRowHeights';

  marginProperty = 'columnHeaderHeight';

  calculatedSizesProperty = 'calculatedRowHeights';

  modelIndexesProperty = 'modelRows';

  firstIndexProperty = 'firstRow';

  treePaddingProperty = 'treePaddingX';

  getHiddenItems = GridUtils.getHiddenRows;

  getNextShownItem = GridUtils.getNextShownRow;

  setSize(metricCalculator, modelIndex, size) {
    metricCalculator.setRowHeight(modelIndex, size);
  }

  resetSize(metricCalculator, modelIndex) {
    metricCalculator.setRowHeight(modelIndex);
  }

  updateSeparator(grid, separatorIndex) {
    grid.setState({
      draggingRowSeparator: separatorIndex,
      isDragging: !!separatorIndex,
    });
  }

  getSeparatorIndex = GridRowSeparatorMouseHandler.getRowSeparatorIndex;
}

export default GridRowSeparatorMouseHandler;
