import {
  createSelectedValuesFilter,
  FilterConditionFactory,
} from '@deephaven/jsapi-utils';
import {
  useDebouncedValue,
  useIsEqualMemo,
  useMappedSelection,
} from '@deephaven/react-hooks';
import {
  isSelectionMaybeInvertedEqual,
  KeyedItem,
  WindowedListData,
} from '@deephaven/utils';
import { useMemo } from 'react';
import useTableUtils from './useTableUtils';

export const DEBOUNCE_MS = 300;

export interface UseDebouncedViewportSelectionFilterOptions<TItem, TValue> {
  viewportData: WindowedListData<KeyedItem<TItem>>;
  columnName: string;
  shouldSelectAllOnNoSelection: boolean;
  mapItemToValue: (item: KeyedItem<TItem>) => TValue;
}

/**
 * Creates a filter factory for the current selected keys of a viewport. The
 * selected keys will be mapped to values to match in a given column name. The
 * resulting filter factory is debounced to allow some cushion for cases where
 * a user rapidly changes selections, e.g. in a checkbox list.
 */
export function useDebouncedViewportSelectionFilter<TItem, TValue>({
  viewportData,
  columnName,
  shouldSelectAllOnNoSelection,
  mapItemToValue,
}: UseDebouncedViewportSelectionFilterOptions<
  TItem,
  TValue
>): FilterConditionFactory {
  const tableUtils = useTableUtils();

  // Map selection to values contained in the column to filter
  const valuesSelection = useMappedSelection(viewportData, mapItemToValue);

  // Debounce so user can rapidly select multiple items in a row without the
  // cost of updating the table on each change
  const debouncedValuesSelection = useDebouncedValue(
    valuesSelection,
    DEBOUNCE_MS
  );

  // In cases where a user rapidly selects then deselects the selection
  // reference will change, but the state it represents will remain unchanged.
  // Memoize based on the selection value to avoid unnecessarily re-applying
  // table filters.
  const memoValuesSelection = useIsEqualMemo(
    debouncedValuesSelection,
    isSelectionMaybeInvertedEqual
  );

  return useMemo(
    () =>
      createSelectedValuesFilter(
        tableUtils,
        columnName,
        memoValuesSelection.selection,
        shouldSelectAllOnNoSelection,
        memoValuesSelection.isInverted
      ),
    [columnName, memoValuesSelection, shouldSelectAllOnNoSelection, tableUtils]
  );
}

export default useDebouncedViewportSelectionFilter;
