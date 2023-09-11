import { useMemo } from 'react';
import {
  createFilterConditionFactory,
  createNotNullOrEmptyFilterCondition,
} from '@deephaven/jsapi-utils';
import useTableUtils from './useTableUtils';

export function useNotNullOrEmptyFilter(
  columnNames: string | string[],
  conditionOperator: 'and' | 'or' = 'or'
) {
  const tableUtils = useTableUtils();

  const notNullOrEmptyFilterCondition = useMemo(
    () => createNotNullOrEmptyFilterCondition(tableUtils),
    [tableUtils]
  );

  return useMemo(
    () =>
      createFilterConditionFactory(
        columnNames,
        notNullOrEmptyFilterCondition,
        conditionOperator
      ),
    [columnNames, conditionOperator, notNullOrEmptyFilterCondition]
  );
}

export default useNotNullOrEmptyFilter;
