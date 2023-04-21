import { useCallback, useEffect } from 'react';
import { RollupConfig, Table, TreeTable } from '@deephaven/jsapi-shim';
import { usePromiseFactory } from '@deephaven/react-hooks';

/**
 * Return type of `useRollupTable` hook.
 */
export interface UseRollupTableResult {
  treeTable: TreeTable | null;
  error: string | Error | null;
  isError: boolean;
  isLoading: boolean;
}

/**
 * Creates and subscribes to a `rollup` derived TreeTable and unsubscribes on
 * unmount.
 * @param table The table to call `rollup` on.
 * @param rollupConfig Configuration object to pass to `rollup` method.
 */
export default function useRollupTable(
  table: Table | null,
  {
    groupingColumns = null,
    aggregations = null,
    includeConstituents = false,
    includeDescriptions = false,
    includeOriginalColumns = false,
  }: Partial<RollupConfig>
): UseRollupTableResult {
  const rollup = useCallback(
    async () =>
      table?.rollup({
        groupingColumns,
        aggregations,
        includeConstituents,
        includeOriginalColumns,
        includeDescriptions,
      }) ?? null,
    [
      aggregations,
      groupingColumns,
      includeConstituents,
      includeDescriptions,
      includeOriginalColumns,
      table,
    ]
  );

  const { data: treeTable, error, isError, isLoading } = usePromiseFactory(
    rollup,
    []
  );

  useEffect(
    () => () => {
      treeTable?.close();
    },
    [treeTable]
  );

  return { treeTable, error, isError, isLoading };
}
