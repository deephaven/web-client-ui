import { useMemo } from 'react';
import type { FilterCondition, Table, TreeTable } from '@deephaven/jsapi-types';
import type { FilterConditionFactory } from '@deephaven/jsapi-utils';
import { removeNullAndUndefined } from '@deephaven/utils';

export function useFilterConditionFactories(
  maybeTable: Table | TreeTable | null | undefined,
  ...filterConditionFactories: FilterConditionFactory[]
): FilterCondition[] {
  return useMemo(
    () =>
      removeNullAndUndefined(
        ...filterConditionFactories.map(f => f(maybeTable))
      ),
    // Intentionally disabling hooks check so we can spread
    // the array items as dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maybeTable, ...filterConditionFactories]
  );
}

export default useFilterConditionFactories;
