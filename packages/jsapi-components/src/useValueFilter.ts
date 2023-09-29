import { useMemo } from 'react';
import {
  createValueFilter,
  FilterConditionFactory,
} from '@deephaven/jsapi-utils';
import useTableUtils from './useTableUtils';

/**
 * Create a filter condition factory for a filter operator that matches the given value.
 * @param columnNames Column names to compare value to
 * @param value Value to match
 * @param operator Operator to use for matching
 */
export function useValueFilter(
  columnNames: string | string[],
  value: string,
  operator: 'contains' | 'eq' | 'notEq'
): FilterConditionFactory {
  const tableUtils = useTableUtils();

  return useMemo(
    () => createValueFilter(tableUtils, columnNames, value, operator),
    [columnNames, operator, tableUtils, value]
  );
}

export default useValueFilter;
