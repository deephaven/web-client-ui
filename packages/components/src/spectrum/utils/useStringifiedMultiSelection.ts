import { Key, useCallback, useMemo } from 'react';
import {
  getItemKey,
  ItemKey,
  ItemSelection,
  itemSelectionToStringSet,
  NormalizedItem,
} from './itemUtils';

export interface UseStringifiedMultiSelectionOptions {
  normalizedItems: NormalizedItem[];
  selectedKeys?: 'all' | Iterable<ItemKey>;
  defaultSelectedKeys?: 'all' | Iterable<ItemKey>;
  disabledKeys?: Iterable<ItemKey>;
  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (keys: ItemSelection) => void;
}

export interface UseStringifiedMultiSelectionResult {
  /** Stringified selection keys */
  selectedStringKeys?: 'all' | Set<Key>;
  /** Stringified default selection keys */
  defaultSelectedStringKeys?: 'all' | Set<Key>;
  /** Stringified disabled keys */
  disabledStringKeys?: 'all' | Set<Key>;
  /** Handler that is called when the string key selections change */
  onStringSelectionChange: (keys: 'all' | Set<Key>) => void;
}

/**
 * Spectrum collection components treat keys as strings if the `key` prop is
 * explicitly set on `Item` elements. Since we do this in `useRenderNormalizedItem`,
 * we need to ensure that keys are strings in order for selection to work. We
 * then need to convert back to the original key types in the onChange handler.
 * This hook encapsulates converting to and from strings so that keys can match
 * the original key type.
 * @param normalizedItems The normalized items to select from.
 * @param selectedKeys The currently selected keys in the collection.
 * @param defaultSelectedKeys The initial selected keys in the collection.
 * @param disabledKeys The currently disabled keys in the collection.
 * @param onChange Handler that is called when the selection changes.
 * @returns UseStringifiedMultiSelectionResult with stringified key sets and
 * string key selection change handler.
 */
export function useStringifiedMultiSelection({
  normalizedItems,
  defaultSelectedKeys,
  disabledKeys,
  selectedKeys,
  onChange,
}: UseStringifiedMultiSelectionOptions): UseStringifiedMultiSelectionResult {
  const selectedStringKeys = useMemo(
    () => itemSelectionToStringSet(selectedKeys),
    [selectedKeys]
  );

  const defaultSelectedStringKeys = useMemo(
    () => itemSelectionToStringSet(defaultSelectedKeys),
    [defaultSelectedKeys]
  );

  const disabledStringKeys = useMemo(
    () => itemSelectionToStringSet(disabledKeys),
    [disabledKeys]
  );

  const onStringSelectionChange = useCallback(
    (keys: 'all' | Set<Key>) => {
      if (onChange == null) {
        return;
      }

      if (keys === 'all') {
        onChange('all');
        return;
      }

      const actualKeys = new Set<ItemKey>();

      normalizedItems.forEach(item => {
        if (keys.has(String(getItemKey(item)))) {
          actualKeys.add(getItemKey(item));
        }
      });

      onChange(actualKeys);
    },
    [normalizedItems, onChange]
  );

  return {
    selectedStringKeys,
    defaultSelectedStringKeys,
    disabledStringKeys,
    onStringSelectionChange,
  };
}

export default useStringifiedMultiSelection;
