import deepEqual from 'fast-deep-equal';
import memoizeOne from 'memoize-one';
import {
  GridMetricCalculator,
  type GridMetrics,
  type GridMetricState,
  type ModelIndex,
  type ModelSizeMap,
  trimMap,
  isExpandableColumnGridModel,
  type VisibleIndex,
} from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import { assertNotNull } from '@deephaven/utils';
import type IrisGridModel from './IrisGridModel';
import { type IrisGridStateOverride, type ColumnName } from './CommonTypes';
import type ColumnHeaderGroup from './ColumnHeaderGroup';
import { rebalanceTree, type TreeNode } from './TreeRebalanceUtil';

export type IrisGridMetricState = GridMetricState & IrisGridStateOverride;

export class IrisGridMetricCalculator extends GridMetricCalculator {
  // Column widths by name to keep track of columns going in and out of viewport
  private userColumnWidthsByName: Map<ColumnName, number> = new Map();

  // Cached model column names to detect when the column width map update is necessary
  private cachedModelColumnNames: readonly ColumnName[] | undefined;

  private cachedHeaderGroupNames: readonly string[] | undefined;

  // Cached padding maps for column header groups
  private cachedPaddingMaps: Map<string, Map<string, number>> = new Map();

  static getModelColumnRoot(
    model: IrisGridModel,
    modelColumn: ModelIndex
  ): ColumnHeaderGroup | undefined {
    let depth = 0;
    let current = model.getColumnHeaderParentGroup(modelColumn, depth);
    let root = current;

    while (current != null) {
      root = current;
      depth += 1;
      current = model.getColumnHeaderParentGroup(modelColumn, depth);
    }

    return root;
  }

  /**
   * Builds a TreeNode from the model header groups and columns for padding calculation
   * @param name The name of the root node to build the tree for
   * @param model The IrisGridModel containing columns and header groups
   * @param getLeafValue Function to get the value for leaf nodes (columns)
   * @param getGroupValue Function to get the value for group nodes (header groups)
   * @returns The TreeNode structure
   */
  private static buildNode(
    name: string,
    model: IrisGridModel,
    getLeafValue: (name: string) => number,
    getGroupValue: (name: string) => number
  ): TreeNode {
    const headerGroup = model.columnHeaderGroupMap.get(name);

    if (headerGroup) {
      const value = getGroupValue(name);

      const children = headerGroup.children.map(childName =>
        IrisGridMetricCalculator.buildNode(
          childName,
          model,
          getLeafValue,
          getGroupValue
        )
      );

      // Group node
      return {
        name,
        children,
        value,
      };
    }

    // Leaf node
    return {
      name,
      children: [],
      value: getLeafValue(name) ?? 0,
    };
  }

  /**
   * Gets the header padding for a specific column based on the widths of its group tree nodes.
   * We only adjust paddings on the column, because the group widths are automatically sized to fit their children.
   * @param state The current IrisGridMetricState
   * @param modelColumn The column index to get the padding for
   * @param maxColumnWidth Maximum allowed column width, applies only to leaf nodes
   * @returns The calculated header padding for the column
   */
  private getHeaderPadding(
    state: IrisGridMetricState,
    modelColumn: ModelIndex,
    maxColumnWidth: number
  ): number {
    const { model } = state;
    const root = IrisGridMetricCalculator.getModelColumnRoot(
      model,
      modelColumn
    );
    if (root == null) {
      return 0;
    }
    const cachedMap = this.cachedPaddingMaps.get(root.name);
    if (cachedMap != null) {
      return cachedMap.get(model.columns[modelColumn].name) ?? 0;
    }
    const groupTree = IrisGridMetricCalculator.buildNode(
      root.name,
      model,
      name => {
        const columnIndex = model.getColumnIndexByName(name);
        assertNotNull(columnIndex, `${name} not found in model columns`);
        return super.calculateColumnHeaderWidth(
          columnIndex,
          state,
          maxColumnWidth
        );
      },
      name => {
        const group = model.columnHeaderGroupMap.get(name);
        assertNotNull(group, `${name} not found in columnHeaderGroupMap`);
        return this.getColumnHeaderGroupWidth(
          group.childIndexes[0],
          group.depth,
          state,
          maxColumnWidth
        );
      }
    );
    const paddingMap = rebalanceTree(groupTree);
    this.cachedPaddingMaps.set(root.name, paddingMap);
    return paddingMap.get(model.columns[modelColumn].name) ?? 0;
  }

  private getCachedCurrentModelColumnNames = memoizeOne(
    (columns: readonly dh.Column[]) => columns.map(col => col.name)
  );

  private getCachedCurrentHeaderGroupNames = memoizeOne(
    (columnHeaderGroups: readonly ColumnHeaderGroup[]) =>
      columnHeaderGroups.map(group => group.name)
  );

  private updateCalculatedColumnWidths(model: IrisGridModel): void {
    assertNotNull(this.cachedModelColumnNames);
    const calculatedColumnWidthsByName = new Map<ColumnName, number>();
    this.cachedModelColumnNames.forEach((name, index) => {
      const prevColumnWidth = this.calculatedColumnWidths.get(index);
      if (prevColumnWidth != null) {
        calculatedColumnWidthsByName.set(name, prevColumnWidth);
      }
    });
    this.resetCalculatedColumnWidths();
    calculatedColumnWidthsByName.forEach((width, name) => {
      const index = model.getColumnIndexByName(name);
      if (index != null) {
        this.calculatedColumnWidths.set(index, width);
      }
    });
    trimMap(this.calculatedColumnWidths);
  }

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
    const modelColumnNames = this.getCachedCurrentModelColumnNames(
      model.columns
    );
    if (
      this.cachedModelColumnNames != null &&
      this.cachedModelColumnNames !== modelColumnNames &&
      !deepEqual(modelColumnNames, this.cachedModelColumnNames)
    ) {
      // Preserve column widths when possible to minimize visual shifts in the grid layout
      this.updateCalculatedColumnWidths(model);
      this.updateUserColumnWidths(model);
      this.cachedPaddingMaps.clear();
    }
    this.cachedModelColumnNames = modelColumnNames;

    if (
      this.cachedHeaderGroupNames != null &&
      !deepEqual(
        this.getCachedCurrentHeaderGroupNames(model.columnHeaderGroups),
        this.cachedHeaderGroupNames
      )
    ) {
      this.resetCalculatedColumnWidths();
      this.cachedPaddingMaps.clear();
    }
    this.cachedHeaderGroupNames = model.columnHeaderGroups.map(
      group => group.name
    );
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

  getCalculatedColumnWidths(): ModelSizeMap {
    return this.calculatedColumnWidths;
  }

  /**
   * Calculate the width of the specified column's header
   * @param modelColumn ModelIndex of the column to get the header width for
   * @param state The grid metric state
   * @param maxColumnWidth Maximum allowed column width, applies only to leaf nodes
   * @returns The calculated width of the column header
   */
  calculateColumnHeaderWidth(
    modelColumn: ModelIndex,
    state: IrisGridMetricState,
    maxColumnWidth: number
  ): number {
    const { model } = state;

    const parent = model.getColumnHeaderParentGroup(modelColumn, 0);

    const baseHeaderWidth = super.calculateColumnHeaderWidth(
      modelColumn,
      state,
      maxColumnWidth
    );

    // Column header with no grouping, use base implementation
    if (parent == null) {
      return baseHeaderWidth;
    }

    const headerPadding = this.getHeaderPadding(
      state,
      modelColumn,
      maxColumnWidth
    );

    return baseHeaderWidth + headerPadding;
  }

  // Original width of column header group content, including title, padding, icons, etc.
  // Does not include any rebalancing adjustments
  getColumnHeaderGroupWidth(
    modelColumn: ModelIndex,
    depth: number,
    state: IrisGridMetricState,
    maxColumnWidth: number
  ): number {
    const { model, theme, context } = state;
    const { headerHorizontalPadding, headerFont } = theme;
    this.calculateLowerFontWidth(headerFont, context);
    this.calculateUpperFontWidth(headerFont, context);

    const padding = headerHorizontalPadding * 2;

    const headerText = model.textForColumnHeader(modelColumn, depth);

    const isColumnExpandable =
      isExpandableColumnGridModel(model) &&
      model.isColumnExpandable(modelColumn);

    const expandCollapseIconWidth = isColumnExpandable ? theme.iconSize : 0;

    if (headerText !== undefined && headerText !== '') {
      return (
        this.calculateTextWidth(
          context,
          headerFont,
          headerText,
          maxColumnWidth - padding
        ) +
        padding +
        expandCollapseIconWidth
      );
    }

    return padding + expandCollapseIconWidth;
  }

  /**
   * Get metrics for positioning the filter bar input field.
   * @param index The visible index of the column to get the filter box coordinates for
   * @param state The current IrisGridMetricState
   * @param metrics The grid metrics
   * @returns Positioning metrics for the filter bar input field, or null if positioning cannot be determined
   */
  // eslint-disable-next-line class-methods-use-this
  getFilterBoxCoordinates(
    index: VisibleIndex,
    state: IrisGridMetricState,
    metrics: GridMetrics
  ): { x: number; y: number; width: number; height: number } | null {
    // Only handle standard columns (>= 0) in the base implementation
    // Plugins can override to handle special columns (e.g., negative indices)
    if (index < 0) {
      return null;
    }

    const { theme } = state;
    const { gridX, gridY, allColumnXs, allColumnWidths } = metrics;

    const columnX = allColumnXs.get(index);
    const columnWidth = allColumnWidths.get(index);
    const columnY = -(theme.filterBarHeight ?? 0);

    if (columnX == null || columnWidth == null) {
      return null;
    }

    return {
      x: gridX + columnX,
      y: gridY + columnY,
      width: columnWidth + 1, // cover right border
      height: (theme.filterBarHeight ?? 0) - 1, // remove bottom border
    };
  }
}

export default IrisGridMetricCalculator;
