import { WindowedListData } from '@deephaven/utils';
import { Key, useCallback, useMemo, useState } from 'react';

export interface UseWindowedListDataOptions<T> {
  getKey?: (item: T) => Key;
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
  const [items, setItems] = useState<T[]>([]);

  const [selectedKeys, setSelectedKeys] = useState<'all' | Set<Key>>(
    () => new Set()
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

  /** Append items to the end of the list */
  const append = useCallback((values: Iterable<T>) => {
    setItems(prevItems => [...prevItems, ...values]);
  }, []);

  /** Insert items starting at the given index */
  const insert = useCallback((index: number, values: Iterable<T>) => {
    setItems(prevItems => [
      ...prevItems.slice(0, index),
      ...values,
      ...prevItems.slice(index),
    ]);
  }, []);

  /** Remove items with the given keys */
  const remove = useCallback(
    (keys: Iterable<Key>) => {
      const keySet = new Set(keys);
      setItems(prevItems =>
        prevItems.filter(item => !keySet.has(getKey(item)))
      );
    },
    [getKey]
  );

  /** Put a given item in the slot corresponding to a given key */
  const update = useCallback(
    (key: Key, item: T) => {
      const i = items.findIndex(matchKey(key));
      if (i === -1) {
        return;
      }

      setItems(prevItems => [
        ...prevItems.slice(0, i),
        item,
        ...prevItems.slice(i + 1),
      ]);
    },
    [items, matchKey]
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

      setItems(newItems);
    },
    [items, matchKey]
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
      setItems,
      setSelectedKeys,
      update,
    }),
    [
      append,
      bulkUpdate,
      findItem,
      getItem,
      insert,
      items,
      remove,
      setItems,
      selectedKeys,
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
