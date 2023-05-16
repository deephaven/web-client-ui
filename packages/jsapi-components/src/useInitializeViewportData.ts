import { useEffect } from 'react';
import { ListData, useListData } from '@react-stately/data';
import type { Table, TreeTable } from '@deephaven/jsapi-types';
import { KeyedItem, generateEmptyKeyedItems } from '@deephaven/jsapi-utils';
import { usePrevious } from '@deephaven/react-hooks';
import useTableSize from './useTableSize';

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
 * @returns a React Stately ListData object. Note that this object is recreated
 * by React Stately on every render.
 */
export default function useInitializeViewportData<T>(
  table: Table | TreeTable | null
): ListData<KeyedItem<T>> {
  const viewportData = useListData<KeyedItem<T>>({});

  const prevTable = usePrevious(table);

  // If the table changes size, we need to re-initialize it.
  const size = Math.max(0, useTableSize(table));

  // We only want this to fire 1x once the table exists. Note that `useListData`
  // has no way to respond to a reference change of the `table` instance so we
  // have to manually delete any previous keyed items from the list.
  useEffect(() => {
    let currentSize = viewportData.items.length;

    // If our table instance has changed, we want to clear all items from state
    if (table !== prevTable && currentSize) {
      viewportData.remove(...viewportData.items.map(({ key }) => key));
      currentSize = 0;
    }

    if (!table) {
      return;
    }

    if (size > currentSize) {
      viewportData.insert(
        currentSize,
        ...generateEmptyKeyedItems<T>(currentSize, size - 1)
      );
    } else if (size < currentSize) {
      const keys = viewportData.items.slice(size).map(({ key }) => key);
      viewportData.remove(...keys);
    }

    // Intentionally excluding viewportData since it changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, table]);

  return viewportData;
}
