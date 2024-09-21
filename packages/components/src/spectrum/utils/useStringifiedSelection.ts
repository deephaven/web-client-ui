import { type Key, useCallback, useMemo } from 'react';
import {
  getItemKey,
  type ItemKey,
  itemSelectionToStringSet,
  type NormalizedItem,
  type NormalizedSection,
} from './itemUtils';

export interface UseStringifiedSelectionOptions {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  selectedKey: ItemKey | null | undefined;
  defaultSelectedKey: ItemKey | undefined;
  disabledKeys: Iterable<ItemKey> | undefined;
  onChange: ((key: ItemKey | null) => void) | undefined;
}

export interface UseStringifiedSelectionResult {
  defaultSelectedStringKey?: Key;
  selectedStringKey?: Key | null;
  disabledStringKeys?: Set<Key>;
  onStringSelectionChange: (key: Key | null) => void;
}

/**
 * Spectrum collection components treat keys as strings if the `key` prop is
 * explicitly set on `Item` elements. Since we do this in `useRenderNormalizedItem`,
 * we need to ensure that keys are strings in order for selection to work. We
 * then need to convert back to the original key types in the onChange handler.
 * This hook encapsulates converting to and from strings so that keys can match
 * the original key type.
 * @param normalizedItems The normalized items to select from.
 * @param selectedKey The currently selected key in the collection.
 * @param defaultSelectedKey The initial selected key in the collection.
 * @param disabledKeys The currently disabled keys in the collection.
 * @param onChange Handler that is called when the selection changes.
 * @returns UseStringifiedSelectionResult with stringified key sets and string
 * key selection change handler.
 */
export function useStringifiedSelection({
  normalizedItems,
  defaultSelectedKey,
  selectedKey,
  disabledKeys,
  onChange,
}: UseStringifiedSelectionOptions): UseStringifiedSelectionResult {
  const selectedStringKey = useMemo(
    () => (selectedKey == null ? selectedKey : String(selectedKey)),
    [selectedKey]
  );

  const defaultSelectedStringKey = useMemo(
    () =>
      defaultSelectedKey == null
        ? defaultSelectedKey
        : String(defaultSelectedKey),
    [defaultSelectedKey]
  );

  const disabledStringKeys = useMemo(
    () => itemSelectionToStringSet(disabledKeys),
    [disabledKeys]
  );

  const onStringSelectionChange = useCallback(
    (key: Key | null): void => {
      if (onChange == null) {
        return;
      }

      // The `key` arg will always be a string due to us setting the `Item` key
      // prop in `renderItem`. We need to find the matching item to determine
      // the actual key.
      const selectedItem = normalizedItems.find(
        item => String(getItemKey(item)) === key
      );

      const actualKey = getItemKey(selectedItem) ?? key;

      onChange(actualKey);
    },
    [normalizedItems, onChange]
  );

  return {
    selectedStringKey,
    defaultSelectedStringKey,
    disabledStringKeys,
    onStringSelectionChange,
  };
}

export default useStringifiedSelection;
