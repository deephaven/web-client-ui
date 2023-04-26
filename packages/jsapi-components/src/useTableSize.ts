import { useState } from 'react';
import { Table, TreeTable } from '@deephaven/jsapi-shim';
import { getSize } from '@deephaven/jsapi-utils';
import useTableListener from './useTableListener';

/**
 * React hook that returns the size of a given table or zero if table is null or
 * undefined. The hook subscribes to the dh.Table.EVENT_SIZECHANGED and cause a
 * re-render if any events are received to ensure we have the current size.
 * @param table The table to check the size on.
 */
export default function useTableSize(
  table: Table | TreeTable | null | undefined
): number {
  const [, forceRerender] = useState(0);

  useTableListener(table, dh.Table.EVENT_SIZECHANGED, () => {
    forceRerender(i => i + 1);
  });

  return getSize(table);
}
