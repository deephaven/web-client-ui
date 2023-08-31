import { useMemo, useRef } from 'react';
import { KeyedItem } from '@deephaven/utils';

/**
 * Takes an array of items and adds a default item to the top of the list if:
 * 1. defaultDisplayValue is provided
 * 2. The `searchText` is empty or
 *    The `searchText` is contained (case insensitive) in the default item display text.
 * @param items List of items filtered on `searchText`
 * @param displayProp The item prop containing display text
 * @param searchText The current search text that is filtering the items
 * @param defaultDisplayValue The display text to set as the default item `displayProp` value
 */
export function useFilteredItemsWithDefaultValue<
  TItem,
  TProp extends keyof TItem,
>(
  items: KeyedItem<TItem>[],
  displayProp: TProp,
  searchText: string,
  defaultDisplayValue?: string | null
): KeyedItem<TItem>[] {
  // Exclude search text from updating the memo. This ensures that adding /
  // removing of the default item stays in sync with data loading. Otherwise,
  // the item can move while data is still loading.
  const searchTextRef = useRef('');
  searchTextRef.current = searchText;

  return useMemo(() => {
    // If the list is still loading, items will exist, but their item prop will be undefined
    const isLoading = items.length > 0 && items[0].item == null;

    if (
      !isLoading &&
      defaultDisplayValue != null &&
      (searchTextRef.current === '' ||
        defaultDisplayValue
          .toLowerCase()
          .includes(searchTextRef.current.toLowerCase()))
    ) {
      return [
        {
          key: defaultDisplayValue,
          item: { [displayProp]: defaultDisplayValue } as TItem,
        },
        ...items,
      ];
    }

    return items;
  }, [defaultDisplayValue, displayProp, items]);
}

export default useFilteredItemsWithDefaultValue;
