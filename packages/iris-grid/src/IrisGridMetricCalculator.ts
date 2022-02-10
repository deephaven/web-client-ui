import { GridMetricCalculator } from '@deephaven/grid';
import type { VisibleIndex, GridMetricState, GridTheme } from '@deephaven/grid';
import type { FilterCondition, Sort } from '@deephaven/jsapi-shim';
import TableUtils from './TableUtils';
import type IrisGridModel from './IrisGridModel';
import type IrisGridTheme from './IrisGridTheme';

export interface IrisGridMetricState extends GridMetricState {
  model: IrisGridModel;
  theme: typeof IrisGridTheme & typeof GridTheme;
  isFilterBarShown: boolean;
  advancedFilters: Map<
    string,
    { options: unknown; filter: FilterCondition | null }
  >;
  quickFilters: Map<string, { text: string; filter: FilterCondition | null }>;
  sorts: Sort[];
  reverseType: string;
}

/* eslint class-methods-use-this: "off" */
/* eslint react/destructuring-assignment: "off" */
/**
 * Class to calculate all the metrics for a grid.
 * Call getMetrics() with the state to get metrics
 */
class IrisGridMetricCalculator extends GridMetricCalculator {
  getVisibleColumnWidth(
    column: VisibleIndex,
    state: IrisGridMetricState,
    firstColumn: VisibleIndex = this.getFirstColumn(state),
    treePaddingX = this.calculateTreePaddingX(state)
  ): number {
    const { model } = state;
    const hiddenColumns = model.layoutHints?.hiddenColumns ?? [];
    const modelColumn = this.getModelColumn(column, state);

    const existingWidth = this.userColumnWidths.get(modelColumn);
    if (existingWidth !== undefined) {
      return existingWidth;
    }
    if (hiddenColumns.includes(model.columns[modelColumn].name)) {
      return 0;
    }
    return super.getVisibleColumnWidth(
      column,
      state,
      firstColumn,
      treePaddingX
    );
  }

  getGridY(state: IrisGridMetricState): number {
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
