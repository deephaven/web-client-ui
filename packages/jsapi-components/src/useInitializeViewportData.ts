import { useEffect } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { generateEmptyKeyedItems } from '@deephaven/jsapi-utils';
import { useWindowedListData, WindowedListData } from '@deephaven/react-hooks';
import { KeyedItem } from '@deephaven/utils';
import Log from '@deephaven/log';
import useTableSize from './useTableSize';

const log = Log.module('useInitializeViewportData');

/**
 * Given an array of items, returns a new array containing the target number of
 * items. If reuseExistingItems is true, existing items will be re-used. If
 * false, all items will be replaced with new, empty items.
 * @param items The array of items to resize.
 * @param targetSize The desired size of the array.
 * @param reuseExistingItems If true, existing items will be re-used. If false,
 * all items will be replaced with new, empty items.
 * @returns The resized array of items.
 */
function resizeItemsArray<T>({
  items,
  targetSize,
  reuseExistingItems,
}: {
  items: KeyedItem<T, string>[];
  reuseExistingItems: boolean;
  targetSize: number;
}): KeyedItem<T, string>[] {
  const currentSize = items.length;

  // If size isn't changing, do nothing
  if (currentSize === targetSize) {
    return items;
  }

  log.debug('size changed:', { currentSize, targetSize });

  if (!reuseExistingItems) {
    // All items will be replaced with new data. This is preferred in certain
    // scenarios to avoid the user seeing items shift around multiple times
    // while data is being loaded.
    return Array.from(generateEmptyKeyedItems<T>(0, targetSize - 1));
  }

  // Drop extra items
  if (currentSize > targetSize) {
    return items.slice(0, targetSize - 1);
  }

  // Add missing items
  return [...items, ...generateEmptyKeyedItems<T>(currentSize, targetSize - 1)];
}

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
 * @param reuseItemsOnTableResize If true, the items will be reused when the
 * table resizes. Defaults to false which will replace the items when the table
 * resizes.
 * @returns a WindowedListData object.
 */
export function useInitializeViewportData<T>(
  table: dh.Table | dh.TreeTable | null,
  reuseItemsOnTableResize = false
): WindowedListData<KeyedItem<T>> {
  const viewportData = useWindowedListData<KeyedItem<T>>({});

  // If the table changes size, we need to re-initialize it.
  const targetSize = Math.max(0, useTableSize(table));

  // Whenever the table reference or size changes, resize the list.
  useEffect(() => {
    viewportData.setItems(
      resizeItemsArray({
        items: viewportData.items,
        targetSize,
        reuseExistingItems: reuseItemsOnTableResize,
      })
    );

    // Intentionally excluding viewportData since it changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSize, table]);

  return viewportData;
}

export default useInitializeViewportData;
