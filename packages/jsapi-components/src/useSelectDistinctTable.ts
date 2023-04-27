import { useCallback, useEffect } from 'react';
import { Table, TreeTable } from '@deephaven/jsapi-types';
import { usePromiseFactory } from '@deephaven/react-hooks';

/**
 * Creates and subscribes to a `selectDistinct` derived table and unsubscribes
 * on unmount.
 * @param table The table to call `selectDistinct` on.
 * @param columnNames The list of column names to pass to `selectDistinct`.
 */
export default function useSelectDistinctTable(
  table: Table | TreeTable | null,
  ...columnNames: string[]
) {
  const selectDistinct = useCallback(
    async () => table?.selectDistinct(table.findColumns(columnNames)) ?? null,
    // Disabling the exhaustive checks due to the spreading of `columnNames`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, ...columnNames]
  );

  const { data: distinctTable, error, isError, isLoading } = usePromiseFactory(
    selectDistinct,
    []
  );

  useEffect(
    () => () => {
      distinctTable?.close();
    },
    [distinctTable]
  );

  return { distinctTable, error, isError, isLoading };
}
