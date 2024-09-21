import { useMemo } from 'react';
import { type KeyedItem, type SelectionMaybeInverted } from '@deephaven/utils';
import { mapSelection, optimizeSelection } from './SelectionUtils';
import type { WindowedListData } from './useWindowedListData';

/**
 * Given viewport data, maps the current selectedKeys to an optimized selection.
 * The keys are mapped to new values via a `mapItem` function.
 * @param viewportData The viewport to map selections for
 * @param mapItem A function to map an item in the viewport to a new value
 * @param getKey A function to get the key for an item in the viewport.
 */
export function useMappedSelection<TItem, TValue>(
  viewportData: WindowedListData<KeyedItem<TItem>>,
  mapItem: (item: KeyedItem<TItem>) => TValue,
  getKey: (i: number) => string
): SelectionMaybeInverted<TValue> {
  const { getItem, selectedKeys, items } = viewportData;

  return useMemo(() => {
    const { selection, isInverted } = optimizeSelection(
      selectedKeys,
      items.length,
      getKey
    );

    return {
      selection: mapSelection(selection, getItem, mapItem),
      isInverted,
    };
  }, [selectedKeys, items.length, getKey, getItem, mapItem]);
}

export default useMappedSelection;
