import { useEffect } from 'react';
import type { Table, TreeTable } from '@deephaven/jsapi-types';
import { generateEmptyKeyedItems } from '@deephaven/jsapi-utils';
import { useWindowedListData } from '@deephaven/react-hooks';
import { KeyedItem, WindowedListData } from '@deephaven/utils';
import Log from '@deephaven/log';
import useTableSize from './useTableSize';

const log = Log.module('useInitializeViewportData');

/**
 * Initializes a ListData instance that can be used for windowed views of a
 * Table. The list must always contain a KeyedItem for every record in the table,
 * so it is pre-populated with empty items that can be updated with real data as
 * the window changes.
 *
 * IMPORTANT: this will create an empty KeyedItem object for every row in the
 * source table. This is intended for "human" sized tables such as those used in
 * admin panels. This is not suitable for "machine" scale with millions+ rows.
 * @param table The table that will be used to determine the list size.
 * @returns a WindowedListData object.
 */
export function useInitializeViewportData<T>(
  table: Table | TreeTable | null
): WindowedListData<KeyedItem<T>> {
  const viewportData = useWindowedListData<KeyedItem<T>>({});

  // If the table changes size, we need to re-initialize it.
  const targetSize = Math.max(0, useTableSize(table));

  // Whenever the table reference or size changes, replace the list with empty
  // items. This is preferred over updating items in place to avoid the user
  // seeing items shift around multiple times.
  useEffect(() => {
    const currentSize = viewportData.items.length;

    if (targetSize !== currentSize) {
      log.debug('size changed:', { currentSize, targetSize });
      viewportData.setItems(
        Array.from(generateEmptyKeyedItems<T>(0, targetSize - 1))
      );
    }

    // Intentionally excluding viewportData since it changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSize, table]);

  return viewportData;
}

export default useInitializeViewportData;
