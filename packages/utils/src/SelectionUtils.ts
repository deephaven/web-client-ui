import type { Key } from 'react';
import type { Selection } from '@react-types/shared';
import { KeyedItem } from './SpectrumUtils';
import { generateRange } from './RangeUtils';

export type SelectionT<T = string> = 'all' | Set<T>;

export interface SelectionMaybeInverted<TValue> {
  selection: SelectionT<TValue>;
  isInverted: boolean;
}

/**
 * Check 2 SelectionT objects for value equality.
 * @param selectionA
 * @param selectionB
 */
export function isSelectionEqual<T>(
  selectionA: SelectionT<T>,
  selectionB: SelectionT<T>
): boolean {
  if (selectionA === selectionB) {
    return true;
  }

  if (selectionA === 'all' || selectionB === 'all') {
    return false;
  }

  if (selectionA.size !== selectionB.size) {
    return false;
  }

  return [...selectionA.keys()].every(key => selectionB.has(key));
}

/**
 * Check 2 `SelectionMaybeInverted` instances for value equality.
 * @param selectionA
 * @param selectionB
 */
export function isSelectionMaybeInvertedEqual<T>(
  selectionA: SelectionMaybeInverted<T>,
  selectionB: SelectionMaybeInverted<T>
): boolean {
  return (
    selectionA.isInverted === selectionB.isInverted &&
    isSelectionEqual(selectionA.selection, selectionB.selection)
  );
}

/**
 * Map a React Spectrum `Selection` to another `Selection`
 * @param selectedItemKeys
 * @param getItem
 * @param mapItem
 */
export function mapSelection<TItem, TMap>(
  selectedItemKeys: Selection,
  getItem: (key: React.Key) => KeyedItem<TItem>,
  mapItem: (item: KeyedItem<TItem>) => TMap
): SelectionT<TMap> {
  if (selectedItemKeys === 'all') {
    return 'all';
  }

  const keys = [...selectedItemKeys.keys()];

  return new Set(keys.map(key => mapItem(getItem(key))));
}

/**
 * Takes a Selection state and determines if there is a more optimal selection
 * that can be used. For example, if the user selects all and then deselects an
 * item, we want to filter by "not that value" instead of equal to all selected
 * values. Similarly, if 'all' items are selected, we want to optimize this as
 * "no filter".
 * @param selection The selection to optimize
 * @param totalRecords The total number of records that can potentially be selected
 */
export function optimizeSelection(
  selection: Selection,
  totalRecords: number
): { selection: Selection; isInverted: boolean } {
  const isInverted = selection === 'all' || selection.size > totalRecords / 2;

  let optimizedSelection = selection;

  if (isInverted) {
    optimizedSelection =
      selection === 'all'
        ? new Set<Key>()
        : new Set<Key>(
            // Create a new set from any key that is not selected
            [...generateRange(0, totalRecords - 1)]
              .filter(i => !selection.has(String(i)))
              .map(i => String(i))
          );
  }

  return {
    selection: optimizedSelection,
    isInverted,
  };
}
