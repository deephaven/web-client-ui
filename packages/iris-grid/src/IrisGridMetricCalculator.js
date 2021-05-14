import { GridMetricCalculator } from '@deephaven/grid';
import TableUtils from './TableUtils';

/* eslint class-methods-use-this: "off" */
/* eslint react/destructuring-assignment: "off" */
/**
 * Class to calculate all the metrics for a grid.
 * Call getMetrics() with the state to get metrics
 */
class IrisGridMetricCalculator extends GridMetricCalculator {
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
