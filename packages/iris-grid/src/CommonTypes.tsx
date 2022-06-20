import { ModelIndex } from '@deephaven/grid';
import AggregationOperation from './sidebar/aggregations/AggregationOperation';
import { AdvancedFilter, QuickFilter } from './IrisGrid';

export type ColumnName = string;
export type AdvancedFilterMap = Map<ModelIndex, AdvancedFilter>;
export type QuickFilterMap = Map<ModelIndex, QuickFilter>;
export type AggregationMap = Record<AggregationOperation, ColumnName[]>;
export type OperationMap = Record<ColumnName, AggregationOperation[]>;
