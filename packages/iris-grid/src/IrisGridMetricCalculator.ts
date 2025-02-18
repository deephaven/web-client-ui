import { GridMetricCalculator, type ModelSizeMap } from '@deephaven/grid';
import type { GridMetricState } from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import type IrisGridModel from './IrisGridModel';
import { type IrisGridThemeType } from './IrisGridTheme';

export interface IrisGridMetricState extends GridMetricState {
  model: IrisGridModel;
  theme: IrisGridThemeType;
  isFilterBarShown: boolean;
  advancedFilters: Map<
    string,
    { options: unknown; filter: dh.FilterCondition | null }
  >;
  quickFilters: Map<
    string,
    { text: string; filter: dh.FilterCondition | null }
  >;
  sorts: dh.Sort[];
  reverse: boolean;
}

/**
 * Class to calculate all the metrics for a grid.
 * Call getMetrics() with the state to get metrics
 */
export class IrisGridMetricCalculator extends GridMetricCalculator {
  getGridY(state: IrisGridMetricState): number {
    let gridY = super.getGridY(state);
    const {
      isFilterBarShown,
      theme,
      advancedFilters,
      quickFilters,
      sorts,
      reverse,
    } = state;
    if (isFilterBarShown) {
      gridY += theme.filterBarHeight;
    } else if (
      (quickFilters != null && quickFilters.size > 0) ||
      (advancedFilters != null && advancedFilters.size > 0)
    ) {
      gridY += theme.filterBarCollapsedHeight;
    }
    if (reverse && sorts != null && sorts.length > 0) {
      gridY += theme.reverseHeaderBarHeight;
    }

    return gridY;
  }

  getUserColumnWidths(): ModelSizeMap {
    return this.userColumnWidths;
  }

  getCalculatedColumnWidths(): ModelSizeMap {
    return this.calculatedColumnWidths;
  }
}

export default IrisGridMetricCalculator;
