import { type ReactElement, useCallback, useMemo } from 'react';
import { useFilter } from '@react-aria/i18n';
import { useControlledState } from '@react-stately/utils';
import {
  collectEntryItemKeys,
  filterEntries,
  filterJsxChildrenByKeys,
  flattenEntriesToItems,
  type MultiSelectFlatEntry,
  type MultiSelectFlatItem,
} from './multiSelectUtils';

export interface UseMultiSelectFilterOptions {
  allEntries: readonly MultiSelectFlatEntry[];
  wrappedChildren: readonly ReactElement[];
  inputValue: string | undefined;
  defaultInputValue: string;
  onInputChange: ((value: string) => void) | undefined;
  onSearchTextChange: ((text: string) => void) | undefined;
}

export interface UseMultiSelectFilterResult {
  /** Current search text (controlled or uncontrolled). */
  searchText: string;
  /** Set the search text and forward to onSearchTextChange if provided. */
  setSearchText: (value: string) => void;
  /** Flat list of items surviving the current filter (sections expanded). */
  filteredItems: MultiSelectFlatItem[];
  /** Filtered JSX children for `<ListBox>`. */
  filteredJsxChildren: ReactElement[];
}

/**
 * Owns the search/filter state for `MultiSelect`. Supports controlled and
 * uncontrolled `inputValue`.
 */
export function useMultiSelectFilter({
  allEntries,
  wrappedChildren,
  inputValue,
  defaultInputValue,
  onInputChange,
  onSearchTextChange,
}: UseMultiSelectFilterOptions): UseMultiSelectFilterResult {
  const [searchText, setSearchTextInternal] = useControlledState<string>(
    inputValue,
    defaultInputValue,
    onInputChange
  );

  const setSearchText = useCallback(
    (value: string) => {
      setSearchTextInternal(value);
      onSearchTextChange?.(value);
    },
    [setSearchTextInternal, onSearchTextChange]
  );

  const { contains } = useFilter({ sensitivity: 'base' });

  const shouldSkipFiltering = onSearchTextChange != null || searchText === '';

  const filteredEntries = useMemo<readonly MultiSelectFlatEntry[]>(() => {
    if (shouldSkipFiltering) {
      return allEntries;
    }
    return filterEntries(allEntries, searchText, contains);
  }, [allEntries, searchText, contains, shouldSkipFiltering]);

  const filteredItems = useMemo(
    () => flattenEntriesToItems(filteredEntries),
    [filteredEntries]
  );

  const filteredJsxChildren = useMemo<ReactElement[]>(() => {
    if (shouldSkipFiltering) {
      return wrappedChildren as ReactElement[];
    }
    const survivingKeys = collectEntryItemKeys(filteredEntries);
    return filterJsxChildrenByKeys(wrappedChildren, survivingKeys);
  }, [wrappedChildren, filteredEntries, shouldSkipFiltering]);

  return {
    searchText,
    setSearchText,
    filteredItems,
    filteredJsxChildren,
  };
}

export default useMultiSelectFilter;
