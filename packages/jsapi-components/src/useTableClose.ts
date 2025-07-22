import { useEffect } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { isClosed } from '@deephaven/jsapi-utils';

/**
 * React hook that closes a given table when the reference changes or when the
 * component unmounts.
 * @param table
 */
export default function useTableClose(
  table: dh.Table | dh.TreeTable | dh.Widget | null | undefined
): void {
  useEffect(
    () => () => {
      if (table == null) {
        return;
      }

      if (!isClosed(table)) {
        table.close?.();
      }
    },
    [table]
  );
}
