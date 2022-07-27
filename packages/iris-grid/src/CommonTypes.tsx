import { AdvancedFilterOptions } from '@deephaven/jsapi-utils';
import { ModelIndex } from '@deephaven/grid';
import {
  TotalsTableConfig,
  FilterCondition,
  Format,
} from '@deephaven/jsapi-shim';
import { Shortcut } from '@deephaven/components';
import { IconDefinition } from '@deephaven/icons';
import AggregationOperation from './sidebar/aggregations/AggregationOperation';
import { OptionType } from './sidebar';

export type { AdvancedFilterOptions };
export type ColumnName = string;
export type AdvancedFilterMap = Map<ModelIndex, AdvancedFilter>;
export type QuickFilterMap = Map<ModelIndex, QuickFilter>;
export type AggregationMap = Record<AggregationOperation, ColumnName[]>;
export type OperationMap = Record<ColumnName, AggregationOperation[]>;

export type QuickFilter = {
  text: string;
  filter: FilterCondition | null;
};

export type AdvancedFilter = {
  filter: FilterCondition | null;
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

export interface UITotalsTableConfig extends TotalsTableConfig {
  operationOrder: AggregationOperation[];
  showOnTop: boolean;
}

export type InputFilter = {
  name: string;
  type: string;
  value: string;
  excludePanelIds?: string[];
};

export interface UIRow {
  data: Map<ModelIndex, CellData>;
}

export type UIViewportData<R extends UIRow = UIRow> = {
  offset: number;
  rows: R[];
};
export type RowData<T = unknown> = Map<number, { value: T }>;

export type CellData = {
  value: unknown;
  format?: Format;
};
export type PendingDataMap<R extends UIRow = UIRow> = Map<ModelIndex, R>;
