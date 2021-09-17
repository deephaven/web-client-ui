import { GridMetricCalculator } from '@deephaven/grid';
import TableUtils from './TableUtils';

/* eslint class-methods-use-this: "off" */
/* eslint react/destructuring-assignment: "off" */
/**
 * Class to calculate all the metrics for a grid.
 * Call getMetrics() with the state to get metrics
 */
class IrisGridMetricCalculator extends GridMetricCalculator {
  getVisibleColumnWidth(
    column,
    state,
    firstColumn = this.getFirstColumn(state),
    treePaddingX = this.calculateTreePaddingX(state)
  ) {
    const { model } = state;
    const hiddenColumns = model.layoutHints?.hiddenColumns ?? [];

    if (this.userColumnWidths.has(column)) {
      return this.userColumnWidths.get(column);
    } else if (hiddenColumns.includes(model.columns[column].name)) {
      return 0;
    }
    return super.getVisibleColumnWidth(
      column,
      state,
      firstColumn,
      treePaddingX
    );
  }

  getGridY(state) {
    let gridY = super.getGridY(state);
    const {
      isFilterBarShown,
      theme,
      advancedFilters,
      quickFilters,
      sorts,
      reverseType,
    } = state;
    if (isFilterBarShown) {
      gridY += theme.filterBarHeight;
    } else if (
      (quickFilters && quickFilters.size > 0) ||
      (advancedFilters && advancedFilters.size > 0)
    ) {
      gridY += theme.filterBarCollapsedHeight;
    }
    if (reverseType !== TableUtils.REVERSE_TYPE.NONE && sorts.length > 0) {
      gridY += theme.reverseHeaderBarHeight;
    }

    return gridY;
  }
}

export default IrisGridMetricCalculator;
