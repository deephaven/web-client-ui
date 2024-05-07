import type { Key } from 'react';
import type { Selection } from '@react-types/shared';
import {
  generateRange,
  KeyedItem,
  SelectionMaybeInverted,
  SelectionT,
} from '@deephaven/utils';

/**
 * Returns the number of selected items or 'all' if all items are selected.
 * @param size Total size of collection that can have selections
 * @param selection Set of selected keys or 'all'
 */
export function getSelectedItemCountOrAll(
  size: number,
  selection: Selection
): number | 'all' {
  if (size === 0) {
    return 0;
  }

  if (selection === 'all' || size === selection.size) {
    return 'all';
  }

  return selection.size;
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
 * @param getKey A function to get the key for a given index.
 */
export function optimizeSelection(
  selection: Selection,
  totalRecords: number,
  getKey: (i: number) => string
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
              .map(getKey)
              .filter(key => !selection.has(key))
          );
  }

  return {
    selection: optimizedSelection,
    isInverted,
  };
}
