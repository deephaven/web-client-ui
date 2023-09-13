import { useMemo } from 'react';
import {
  createFilterConditionFactory,
  createShowOnlyEmptyFilterCondition,
  FilterConditionFactory,
} from '@deephaven/jsapi-utils';
import useTableUtils from './useTableUtils';

/**
 * Creates a filter condition factory that can be toggle on or off. If on, the
 * filter will match only values that are null or empty strings. If off, the
 * filter will match all values.
 * @param isOn Whether the filter is on or off
 * @param columnNames Column names to filter
 */
export function useShowOnlyEmptyFilter(
  isOn: boolean,
  columnNames: string | string[]
): FilterConditionFactory {
  const tableUtils = useTableUtils();

  const createColumnCondition = useMemo(
    () => createShowOnlyEmptyFilterCondition(tableUtils, isOn),
    [isOn, tableUtils]
  );

  return useMemo(
    () => createFilterConditionFactory(columnNames, createColumnCondition),
    [columnNames, createColumnCondition]
  );
}

export default useShowOnlyEmptyFilter;
