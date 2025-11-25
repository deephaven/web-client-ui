import {
  type AdvancedFilterOptions,
  type SortDescriptor,
} from '@deephaven/jsapi-utils';
import { type GridRangeIndex, type ModelIndex } from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import { type Shortcut } from '@deephaven/components';
import { type IconDefinition } from '@deephaven/icons';
import type AggregationOperation from './sidebar/aggregations/AggregationOperation';
import { type UIRollupConfig, type OptionType } from './sidebar';
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

export type OptionItem = {
  type: OptionType;
  title: string;
  subtitle?: string;
  icon?: IconDefinition;
  isOn?: boolean;
  onChange?: () => void;
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
