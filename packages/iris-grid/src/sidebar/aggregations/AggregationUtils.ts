import TableUtils from '../../TableUtils';
import AggregationOperation from './AggregationOperation';

/**
 * Check if an operation requires a rollup/table grouping
 * @param type The operation to check
 * @returns True if this operation applies to the whole table, false if applies to columns
 */
export const isRollupOperation = (type: AggregationOperation): boolean => {
  switch (type) {
    case AggregationOperation.COUNT:
      return true;
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

type Column = { type: string; name: string };
export const filterValidColumns = (
  columns: Column[],
  operationType: AggregationOperation
): Column[] => columns.filter(c => isValidOperation(operationType, c.type));

export const getOperationColumnNames = (
  columns: Column[],
  operationType: AggregationOperation,
  selected: string[],
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
