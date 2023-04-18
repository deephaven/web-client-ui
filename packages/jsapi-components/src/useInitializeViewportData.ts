import { useEffect } from 'react';
import { useListData } from '@react-stately/data';
import { Table, TreeTable } from '@deephaven/jsapi-shim';
import {
  KeyedItem,
  generateEmptyKeyedItems,
  getSize,
} from '@deephaven/jsapi-utils';

/**
 * Initializes a ListData instance that can be used for windowed views of a
 * Table. The list must always contain a KeyedItem for ever record in the table,
 * so it is pre-populated with empty items that can be updated with real data as
 * the window changes.
 *
 * IMPORTANT: this will create an empty KeyedItem object for every row in the
 * source table. This is intended for "human" sized tables such as those used in
 * admin panels. This is not suitable for "machine" scale with millions+ rows.
 * @param table The table that will be used to determine the list size.
 * @returns
 */
export default function useInitializeViewportData<T>(
  table: Table | TreeTable | null
) {
  const viewportData = useListData<KeyedItem<T>>({});

  // We only want this to fire 1x once the table exists. Note that `useListData`
  // has no way to respond to a reference change of the `table` instance so we
  // have to manually delete any previous keyed items from the list.
  useEffect(() => {
    if (table) {
      if (viewportData.items.length) {
        viewportData.remove(...viewportData.items.keys());
      }

      viewportData.insert(0, ...generateEmptyKeyedItems<T>(getSize(table)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return viewportData;
}
