import { useMemo } from 'react';
import {
  KeyedItem,
  mapSelection,
  optimizeSelection,
  SelectionMaybeInverted,
  WindowedListData,
} from '@deephaven/utils';

/**
 * Given viewport data, maps the current selectedKeys to an optimized selection.
 * The keys are mapped to new values via a `mapItem` function.
 * @param viewportData The viewport to map selections for
 * @param mapItem A function to map an item in the viewport to a new value
 */
export function useMappedSelection<TItem, TValue>(
  viewportData: WindowedListData<KeyedItem<TItem>>,
  mapItem: (item: KeyedItem<TItem>) => TValue
): SelectionMaybeInverted<TValue> {
  const { getItem, selectedKeys, items } = viewportData;

  return useMemo(() => {
    const { selection, isInverted } = optimizeSelection(
      selectedKeys,
      items.length
    );

    return {
      selection: mapSelection(selection, getItem, mapItem),
      isInverted,
    };
  }, [selectedKeys, items.length, getItem, mapItem]);
}

export default useMappedSelection;
