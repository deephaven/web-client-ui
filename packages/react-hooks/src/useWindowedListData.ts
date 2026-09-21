// eslint-disable-next-line no-restricted-imports
import type { ListData } from '@adobe/react-spectrum';
import { useCallback, useMemo, useState } from 'react';
import type { Key } from '@react-types/shared';

/**
 * Subset of React Stately ListData + bulkUpdate.
 */
export type WindowedListData<T> = Pick<
  ListData<T>,
  'items' | 'getItem' | 'selectedKeys' | 'setSelectedKeys' | 'update'
> & {
  append: (values: Iterable<T>) => void;
  bulkUpdate: (itemMap: Map<Key, T>) => void;
  findItem: (key: Key) => T | null;
  insert: (index: number, values: Iterable<T>) => void;
  remove: (keys: Iterable<Key>) => void;
  setItems: (itemsOrUpdater: React.SetStateAction<T[]>) => void;
};

export interface UseWindowedListDataOptions<T> {
  getKey?: (item: T) => Key;
}

interface WindowedListDataState<T> {
  items: T[];
  selectedKeys: 'all' | Set<Key>;
}

/**
 * Manages state associated with an immutable list of data.
 *
 * This hook is a revised version of React Stately's
 * `useListData` hook with a couple of improvements.
 * - Added support for bulk update
 * - Proper memoization of the return object + its members
 * - Using Iterable instead of spread function arguments to avoid stack overflow
 *   for large lists
 * - findItem - method to look for item without throwing an exception if it isn't found
 *
 * @param options.getKey Optional function to derive a key from an item in the list
 */
export function useWindowedListData<T>({
  getKey = defaultGetKey,
}: UseWindowedListDataOptions<T> = {}): WindowedListData<T> {
  const [{ items, selectedKeys }, setDataState] = useState<
    WindowedListDataState<T>
  >({
    items: [],
    selectedKeys: new Set(),
  });

  const setItemsNoPrune = useCallback(
    (itemsOrUpdater: React.SetStateAction<T[]>) => {
      setDataState(prev => {
        const nextItems =
          itemsOrUpdater instanceof Function
            ? itemsOrUpdater(prev.items)
            : itemsOrUpdater;

        if (nextItems === prev.items) {
          return prev;
        }

        return { ...prev, items: nextItems };
      });
    },
    []
  );

  const setSelectedKeys = useCallback(
    (itemsOrUpdater: React.SetStateAction<'all' | Set<Key>>) => {
      setDataState(prev => {
        const nextSelectedKeys =
          itemsOrUpdater instanceof Function
            ? itemsOrUpdater(prev.selectedKeys)
            : itemsOrUpdater;

        if (nextSelectedKeys === prev.selectedKeys) {
          return prev;
        }

        return { ...prev, selectedKeys: nextSelectedKeys };
      });
    },
    []
  );

  /** Determine if key matches an item's key */
  const matchKey = useCallback(
    (key: Key) => (item: T) => getKey(item) === key,
    [getKey]
  );

  /** Search for item with given key. Returns null if not found. */
  const findItem = useCallback(
    (key: Key) => items.find(matchKey(key)) ?? null,
    [items, matchKey]
  );

  /**
   * Get item with the given key. Throws an error if matching item does not exist.
   * Use `findItem` to return null instead of throwing an error.
   */
  const getItem = useCallback(
    (key: Key) => {
      const item = findItem(key);

      if (item == null) {
        throw new Error(`No item found matching key: ${key}`);
      }

      return item;
    },
    [findItem]
  );

  /** Sets items and prunes selected keys based on new items */
  const setItemsAndPruneKeys = useCallback(
    (itemsOrUpdater: React.SetStateAction<T[]>) => {
      setDataState(prev => {
        const nextItems =
          itemsOrUpdater instanceof Function
            ? itemsOrUpdater(prev.items)
            : itemsOrUpdater;

        let nextSelectedKeys = prev.selectedKeys;
        if (prev.selectedKeys !== 'all') {
          const newItemKeys = new Set(nextItems.map(item => getKey(item)));
          const prunedKeys = [...prev.selectedKeys].filter(key =>
            newItemKeys.has(key)
          );
          // prunedKeys must be a subset of previous keys, so just check length
          nextSelectedKeys =
            prunedKeys.length === prev.selectedKeys.size
              ? prev.selectedKeys
              : new Set(prunedKeys);
        }

        if (
          nextItems === prev.items &&
          nextSelectedKeys === prev.selectedKeys
        ) {
          return prev;
        }

        return {
          items: nextItems,
          selectedKeys: nextSelectedKeys,
        };
      });
    },
    [getKey]
  );

  /** Append items to the end of the list */
  const append = useCallback(
    (values: Iterable<T>) => {
      setItemsNoPrune(prevItems => [...prevItems, ...values]);
    },
    [setItemsNoPrune]
  );

  /** Insert items starting at the given index */
  const insert = useCallback(
    (index: number, values: Iterable<T>) => {
      setItemsNoPrune(prevItems => [
        ...prevItems.slice(0, index),
        ...values,
        ...prevItems.slice(index),
      ]);
    },
    [setItemsNoPrune]
  );

  /** Remove items with the given keys */
  const remove = useCallback(
    (keys: Iterable<Key>) => {
      const keySet = new Set(keys);
      setItemsAndPruneKeys(prevItems =>
        prevItems.filter(item => !keySet.has(getKey(item)))
      );
    },
    [getKey, setItemsAndPruneKeys]
  );

  /** Put a given item in the slot corresponding to a given key */
  const update = useCallback(
    (key: Key, item: T) => {
      const i = items.findIndex(matchKey(key));
      if (i === -1) {
        return;
      }

      setItemsNoPrune(prevItems => [
        ...prevItems.slice(0, i),
        item,
        ...prevItems.slice(i + 1),
      ]);
    },
    [items, matchKey, setItemsNoPrune]
  );

  /**
   * Bulk update items from a map of keys to items. It is optimized to only
   * re-create the list 1x.
   */
  const bulkUpdate = useCallback(
    (itemMap: Map<Key, T>): void => {
      if (itemMap.size === 0) {
        return;
      }

      const indices: number[] = [];
      const indexMap = new Map<number, Key>();

      // Build a sorted array of indices for keys we want to update + a map
      // of those indices to their respective keys.
      // eslint-disable-next-line no-restricted-syntax
      for (const key of itemMap.keys()) {
        const i = items.findIndex(matchKey(key));
        indices.push(i);
        indexMap.set(i, key);
      }
      indices.sort((a, b) => a - b);

      const newItems: T[] = [];

      // Build a new items array replacing any items corresponding to our
      // indices array.
      items.forEach((item, i) => {
        if (indices[0] === i) {
          /* eslint-disable @typescript-eslint/no-non-null-assertion */
          const key = indexMap.get(indices.shift()!)!;
          const newItem = itemMap.get(key)!;
          /* eslint-enable @typescript-eslint/no-non-null-assertion */

          newItems.push(newItem);
        } else {
          newItems.push(item);
        }
      });

      setItemsNoPrune(newItems);
    },
    [items, matchKey, setItemsNoPrune]
  );

  const listData = useMemo(
    () => ({
      items,
      selectedKeys,
      append,
      bulkUpdate,
      findItem,
      getItem,
      insert,
      remove,
      setItems: setItemsAndPruneKeys,
      setSelectedKeys,
      update,
    }),
    [
      items,
      selectedKeys,
      append,
      bulkUpdate,
      findItem,
      getItem,
      insert,
      remove,
      setItemsAndPruneKeys,
      setSelectedKeys,
      update,
    ]
  );

  return listData;
}

/**
 * Default getKey function simply returns item.key if the property exists. If
 * not, an error is thrown.
 * @param item
 */
export function defaultGetKey<T>(item: T): Key {
  const hasKey = item != null && typeof item === 'object' && 'key' in item;

  if (!hasKey) {
    throw new Error('Item does not have a `key` prop.');
  }

  return item.key as Key;
}

export default useWindowedListData;
