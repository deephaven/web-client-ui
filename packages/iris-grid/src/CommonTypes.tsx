import {
  type AdvancedFilterOptions,
  type SortDescriptor,
} from '@deephaven/jsapi-utils';
import { type GridRangeIndex, type ModelIndex } from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import { type Shortcut } from '@deephaven/components';
import { type IconDefinition } from '@deephaven/icons';
import { type ComponentType } from 'react';
import type AggregationOperation from './sidebar/aggregations/AggregationOperation';
import { type UIRollupConfig, type OptionItemKey } from './sidebar';
import type IrisGridModel from './IrisGridModel';
import { type IrisGridThemeType } from './IrisGridTheme';

export type RowIndex = ModelIndex;

export type { AdvancedFilterOptions };
export type ColumnName = string;
export type AdvancedFilterMap = Map<ModelIndex, AdvancedFilter>;
export type QuickFilterMap = Map<ModelIndex, QuickFilter>;
export type ReadonlyAdvancedFilterMap = ReadonlyMap<ModelIndex, AdvancedFilter>;
export type ReadonlyQuickFilterMap = ReadonlyMap<ModelIndex, QuickFilter>;
export type ReadonlyAggregationMap = Readonly<
  Record<AggregationOperation, readonly ColumnName[]>
>;
export type OperationMap = Record<ColumnName, readonly AggregationOperation[]>;
export type ReadonlyOperationMap = Readonly<
  Record<ColumnName, readonly AggregationOperation[]>
>;

export type QuickFilter = {
  text: string;
  filter: dh.FilterCondition | null;
};

export type AdvancedFilter = {
  filter: dh.FilterCondition | null;
  options: AdvancedFilterOptions;
};

export type Action = {
  action: () => void;
  shortcut: Shortcut;
};

/**
 * Props passed to a plugin-supplied sidebar page (an item whose
 * `configPage` is set). Pages receive the current model and a
 * back-navigation callback; any additional state access should
 * flow through the model or through props the plugin threads in
 * itself.
 */
export type IrisGridSidebarPageProps = {
  /** Current model the grid is rendering. */
  model: IrisGridModel;
  /** Pop the current page off the sidebar stack. */
  onBack: () => void;
};

export type OptionItem = {
  /**
   * Built-in items use the `OptionType` enum; plugin-contributed items
   * use a namespaced string key (convention `plugin:<name>:<id>`).
   */
  type: OptionItemKey;
  title: string;
  subtitle?: string;
  icon?: IconDefinition;
  isOn?: boolean;
  onChange?: () => void;
  /**
   * Renderer for plugin-supplied sidebar pages. Built-in items leave
   * this undefined — the `IrisGrid` page switch renders them via
   * its existing `case OptionType.*` arms; the `default` case renders
   * `configPage` when present and falls back to a programmer-error
   * throw otherwise.
   */
  configPage?: ComponentType<IrisGridSidebarPageProps>;
};

export interface UITotalsTableConfig extends dh.TotalsTableConfig {
  operationOrder: AggregationOperation[];
  showOnTop: boolean;
}

export type InputFilter = {
  name: string;
  type: string;
  value: string;
  excludePanelIds?: (string | string[])[];
};

export interface UIRow {
  /**
   * The data in the row indexed by column number.
   * If a column is not part of the columns array (i.e. it's hidden by the model/table),
   * then it will be included by its name instead of index.
   */
  data: Map<ModelIndex | ColumnName, CellData>;
}

export type UIViewportData<R extends UIRow = UIRow> = {
  offset: number;
  rows: R[];
};
export type RowData<T = unknown> = Map<number, { value: T }>;

export type CellData = {
  value: unknown;
  format?: dh.Format;
};
export type PendingDataMap<R extends UIRow = UIRow> = ReadonlyMap<RowIndex, R>;

/** Maps from a row index to the errors for that row */
export type PendingDataErrorMap<T extends Error = Error> = ReadonlyMap<
  RowIndex,
  readonly T[]
>;

export interface IrisGridStateOverride extends Record<string, unknown> {
  model: IrisGridModel;
  theme: IrisGridThemeType;
  hoverSelectColumn: GridRangeIndex;
  isFilterBarShown: boolean;
  isMenuShown: boolean;
  isSelectingColumn: boolean;
  loadingScrimProgress: number | null;
  advancedFilters: ReadonlyAdvancedFilterMap;
  quickFilters: ReadonlyQuickFilterMap;
  sorts: readonly SortDescriptor[];
  reverse: boolean;
  rollupConfig: UIRollupConfig | undefined;
}
