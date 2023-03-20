import type { Column } from '@deephaven/jsapi-shim';
import { TableUtils } from '@deephaven/jsapi-utils';
import AggregationOperation from './AggregationOperation';

export const SELECTABLE_OPTIONS = [
  AggregationOperation.SUM,
  AggregationOperation.ABS_SUM,
  AggregationOperation.MIN,
  AggregationOperation.MAX,
  AggregationOperation.VAR,
  AggregationOperation.AVG,
  AggregationOperation.STD,
  AggregationOperation.FIRST,
  AggregationOperation.LAST,
  AggregationOperation.COUNT_DISTINCT,
  AggregationOperation.DISTINCT,
  AggregationOperation.COUNT,
  AggregationOperation.UNIQUE,
];

/**
 * Check if an operation requires a rollup/table grouping
 * @param type The operation to check
 * @returns True if this operation applies to the whole table, false if applies to columns
 */
export const isRollupOperation = (type: AggregationOperation): boolean => {
  switch (type) {
    // currently no rollup only operations, but there has been in the past
    default:
      return false;
  }
};

/**
 * Check if an operation is valid against the given column type
 * @param operationType The operation to check
 * @param columnType The column type to check against
 */
export const isValidOperation = (
  operationType: AggregationOperation,
  columnType: string
): boolean => {
  switch (operationType) {
    case AggregationOperation.COUNT:
    case AggregationOperation.FIRST:
    case AggregationOperation.LAST:
    case AggregationOperation.COUNT_DISTINCT:
    case AggregationOperation.DISTINCT:
    case AggregationOperation.UNIQUE:
      return true;
    case AggregationOperation.MIN:
    case AggregationOperation.MAX:
      return (
        TableUtils.isNumberType(columnType) ||
        TableUtils.isDateType(columnType) ||
        TableUtils.isTextType(columnType)
      );
    case AggregationOperation.SUM:
    case AggregationOperation.ABS_SUM:
    case AggregationOperation.VAR:
    case AggregationOperation.AVG:
    case AggregationOperation.STD:
      return TableUtils.isNumberType(columnType);
    case AggregationOperation.SKIP:
      return false;
    // No default case - if AggregationOperation is added, we'll get a compile time error
  }
};

export const filterValidColumns = (
  columns: readonly Column[],
  operationType: AggregationOperation
): Column[] => columns.filter(c => isValidOperation(operationType, c.type));

export const getOperationColumnNames = (
  columns: readonly Column[],
  operationType: AggregationOperation,
  selected: readonly string[],
  invert: boolean
): string[] =>
  filterValidColumns(columns, operationType)
    .map(({ name }) => name)
    .filter(name => (selected.includes(name) ? !invert : invert));

export default {
  isRollupOperation,
  filterValidColumns,
  getOperationColumnNames,
};
