import { useEffect } from 'react';
import { Table, TreeTable } from '@deephaven/jsapi-shim';
import { isClosed } from '@deephaven/jsapi-utils';

/**
 * React hook that closes a given table when the component unmounts.
 * @param table
 */
export default function useTableCloseOnUnmount(
  table: Table | TreeTable | null | undefined
): void {
  useEffect(
    () => () => {
      if (table == null) {
        return;
      }

      if (!isClosed(table)) {
        table.close();
      }
    },
    [table]
  );
}
