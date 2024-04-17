import { Key, useCallback, useMemo } from 'react';
import {
  getItemKey,
  ItemKey,
  itemSelectionToStringSet,
  NormalizedItem,
  NormalizedSection,
} from './itemUtils';

export interface UseStringifiedSelectionOptions {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  selectedKey: ItemKey | null | undefined;
  defaultSelectedKey: ItemKey | undefined;
  disabledKeys: Iterable<ItemKey> | undefined;
  onChange: (key: ItemKey) => void | undefined;
}

export interface UseStringifiedSelectionResult {
  defaultSelectedStringKey?: Key;
  selectedStringKey?: Key | null;
  disabledStringKeys?: Set<Key>;
  onStringSelectionChange: (key: Key) => void;
}

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
    (key: Key): void => {
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
