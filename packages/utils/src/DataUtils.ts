import type { Key } from 'react';
import type { ListData } from '@adobe/react-spectrum';

export const EMPTY_ARRAY = Object.freeze([]);

export const EMPTY_MAP: ReadonlyMap<never, never> = new Map<never, never>();

export const EMPTY_FUNCTION = () => undefined;

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
  setItems: (items: T[]) => void;
};

/**
 * Filters out any null or undefined values from an array.
 * @param maybeDefined
 */
export function removeNullAndUndefined<T>(
  ...maybeDefined: (T | null | undefined)[]
): T[] {
  return maybeDefined.filter((m): m is T => m != null);
}
