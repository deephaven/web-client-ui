import deepEqual from 'fast-deep-equal';
import memoizeOne from 'memoize-one';
import {
  GridMetricCalculator,
  GridMetrics,
  ModelIndex,
  ModelSizeMap,
  trimMap,
} from '@deephaven/grid';
import type { GridMetricState } from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import { assertNotNull } from '@deephaven/utils';
import type IrisGridModel from './IrisGridModel';
import { IrisGridThemeType } from './IrisGridTheme';
import {
  ColumnName,
  ReadonlyAdvancedFilterMap,
  ReadonlyQuickFilterMap,
} from './CommonTypes';

export interface IrisGridMetricState extends GridMetricState {
  model: IrisGridModel;
  theme: IrisGridThemeType;
  isFilterBarShown: boolean;
  advancedFilters: ReadonlyAdvancedFilterMap;
  quickFilters: ReadonlyQuickFilterMap;
  sorts: readonly dh.Sort[];
  reverse: boolean;
}

export class IrisGridMetricCalculator extends GridMetricCalculator {
  // Column widths by name to keep track of columns going in and out of viewport
  userColumnWidthsByName: Map<ColumnName, number> = new Map();

  // Cached model column names to detect when the column width map update is necessary
  private cachedModelColumnNames: readonly ColumnName[] | undefined;

  private getCachedCurrentModelColumnNames = memoizeOne(
    (columns: readonly dh.Column[]) => columns.map(col => col.name)
  );

  /**
   * Updates the user column widths based on the current model state
   * @param model The current IrisGridModel
   */
  private updateUserColumnWidths(model: IrisGridModel): void {
    this.userColumnWidths = new Map<ModelIndex, number>();
    this.userColumnWidthsByName.forEach((width, name) => {
      const modelIndex = model.getColumnIndexByName(name);
      if (modelIndex != null) {
        super.setColumnWidth(modelIndex, width);
      }
    });
  }

  /**
   * Updates the user and calculated column widths if the model columns have changed
   * @param model The current IrisGridModel
   */
  private updateColumnWidthsIfNecessary(model: IrisGridModel): void {
    // Comparing model.columns references wouldn't work here because
    // the reference can change in the model without the actual column definitions changing
    if (
      !deepEqual(
        this.getCachedCurrentModelColumnNames(model.columns),
        this.cachedModelColumnNames
      )
    ) {
      this.resetCalculatedColumnWidths();
      this.updateUserColumnWidths(model);
    }
  }

  getGridY(state: IrisGridMetricState): number {
    // The state here seems to be a GridMetricState with stateOverrides passed from IrisGrid in the props,
    // not guaranteed to be IrisGridMetricState
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

  /**
   * Gets the metrics for the current state. This method has to be called before setColumnSize or resetColumnSize.
   * @param state The current IrisGridMetricState
   * @returns The metrics for the current state
   */
  getMetrics(state: IrisGridMetricState): GridMetrics {
    const { model } = state;
    // Update column widths if columns in the cached model don't match the current model passed in the state
    this.updateColumnWidthsIfNecessary(model);

    this.cachedModelColumnNames = model.columns.map(col => col.name);
    return super.getMetrics(state);
  }

  /**
   * Sets the width for a specific column by index
   * @param column The index of the column to set
   * @param size The new width for the column
   */
  setColumnWidth(column: number, size: number): void {
    super.setColumnWidth(column, size);
    assertNotNull(
      this.cachedModelColumnNames,
      'setColumnWidth should be called after getMetrics'
    );
    const name = this.cachedModelColumnNames[column];
    if (name != null) {
      this.userColumnWidthsByName.set(name, size);
      trimMap(this.userColumnWidthsByName);
    }
  }

  /**
   * Resets the width for a specific column by index
   * @param column The index of the column to reset
   */
  resetColumnWidth(column: number): void {
    super.resetColumnWidth(column);
    assertNotNull(
      this.cachedModelColumnNames,
      'resetColumnWidth should be called after getMetrics'
    );
    const name = this.cachedModelColumnNames[column];
    if (name != null) {
      this.userColumnWidthsByName.delete(name);
    }
  }

  /**
   * Resets all user column widths
   */
  resetAllColumnWidths(): void {
    this.userColumnWidths = new Map<ModelIndex, number>();
    this.userColumnWidthsByName = new Map<ColumnName, number>();
  }

  /**
   * Gets the user column widths
   * @returns A map of user column widths
   */
  getUserColumnWidths(): ModelSizeMap {
    // This might return stale data if getMetrics hasn't been called
    return this.userColumnWidths;
  }
}

export default IrisGridMetricCalculator;
