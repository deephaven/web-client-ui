import { useCallback, useMemo, useRef } from 'react';
import type { Key, Selection } from '@react-types/shared';
import { useControlledState } from '@react-stately/utils';
import {
  type ItemKey,
  type ItemSelection,
  itemSelectionToStringSet,
} from '../utils';
import { resolveSelection, type MultiSelectFlatItem } from './multiSelectUtils';

export interface UseMultiSelectStateOptions {
  selectedKeys: 'all' | Iterable<ItemKey> | undefined;
  defaultSelectedKeys: 'all' | Iterable<ItemKey> | undefined;
  disabledKeys: Iterable<ItemKey> | undefined;
  onChange: ((keys: ItemSelection) => void) | undefined;
  onSelectionChange: ((keys: ItemSelection) => void) | undefined;
  allKeys: string[];
}

export interface UseMultiSelectStateResult {
  /** Resolved selection set (controlled or uncontrolled). */
  selectedKeys: Set<string>;
  /** Selected keys as an array (memoized for stable rendering). */
  selectedKeyArray: string[];
  /** Disabled keys, ready to pass to `<ListBox disabledKeys>`. */
  listBoxDisabledKeys: Iterable<string> | undefined;
  /** Toggle a single key in the selection. */
  toggleKey: (key: string) => void;
  /** Apply a `Selection` from the underlying `<ListBox>`. */
  applyListBoxSelection: (
    selection: Selection,
    filteredItems: MultiSelectFlatItem[]
  ) => void;
}

export function useMultiSelectState({
  selectedKeys: propSelectedKeys,
  defaultSelectedKeys,
  disabledKeys: propDisabledKeys,
  onChange: propOnChange,
  onSelectionChange: propOnSelectionChange,
  allKeys,
}: UseMultiSelectStateOptions): UseMultiSelectStateResult {
  const controlledKeys = useMemo<Set<string> | undefined>(
    () =>
      propSelectedKeys !== undefined
        ? resolveSelection(propSelectedKeys, allKeys)
        : undefined,
    [propSelectedKeys, allKeys]
  );

  const handleChange = useCallback(
    (next: Set<string>) => {
      const callback = propOnChange ?? propOnSelectionChange;
      callback?.(next as ItemSelection);
    },
    [propOnChange, propOnSelectionChange]
  );

  // Resolve the initial default once. useControlledState only reads this on
  // first render in uncontrolled mode and ignores it in controlled mode, so
  // recomputing on every render would just allocate a throwaway Set.
  const initialDefaultRef = useRef<Set<string> | undefined>(undefined);
  if (initialDefaultRef.current === undefined) {
    initialDefaultRef.current = resolveSelection(defaultSelectedKeys, allKeys);
  }

  const [selectedKeys, setSelectedKeys] = useControlledState<Set<string>>(
    controlledKeys,
    initialDefaultRef.current,
    handleChange
  );

  // Mirror selectedKeys into a ref so toggleKey/applyListBoxSelection can
  // read the latest value without re-creating on every change.
  const selectedKeysRef = useRef(selectedKeys);
  selectedKeysRef.current = selectedKeys;

  const listBoxDisabledKeys = useMemo<Iterable<string> | undefined>(
    () => itemSelectionToStringSet(propDisabledKeys),
    [propDisabledKeys]
  );

  const toggleKey = useCallback(
    (key: string) => {
      const next = new Set(selectedKeysRef.current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      setSelectedKeys(next);
    },
    [setSelectedKeys]
  );

  const applyListBoxSelection = useCallback(
    (selection: Selection, filteredItems: MultiSelectFlatItem[]) => {
      if (selection === 'all') {
        setSelectedKeys(new Set(allKeys));
        return;
      }

      // Preserve selected keys for items not in the current filtered list.
      // The ListBox only knows about rendered (filtered) items, so it can't
      // manage selection state for items hidden by search filtering.
      const filteredKeySet = new Set(filteredItems.map(i => i.key));
      const next = new Set(
        [...selectedKeysRef.current].filter(k => !filteredKeySet.has(k))
      );
      selection.forEach((k: Key) => next.add(String(k)));
      setSelectedKeys(next);
    },
    [allKeys, setSelectedKeys]
  );

  const selectedKeyArray = useMemo(() => [...selectedKeys], [selectedKeys]);

  return {
    selectedKeys,
    selectedKeyArray,
    listBoxDisabledKeys,
    toggleKey,
    applyListBoxSelection,
  };
}

export default useMultiSelectState;
