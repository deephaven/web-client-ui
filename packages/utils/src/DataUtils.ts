export const EMPTY_ARRAY = Object.freeze([]);

export const EMPTY_MAP: ReadonlyMap<never, never> = new Map<never, never>();

export const EMPTY_FUNCTION = (): void => undefined;

export type KeyedItem<
  TItem,
  TKey extends string | number | boolean | undefined = string,
> = TKey extends undefined
  ? { key?: TKey; item?: TItem }
  : {
      key: TKey;
      item?: TItem;
    };

export type SelectionT<T = string> = 'all' | Set<T>;

export interface SelectionMaybeInverted<TValue> {
  selection: SelectionT<TValue>;
  isInverted: boolean;
}

/**
 * Wrap a value in an array if it is not already an array. Otherwise return the
 * value.
 * @param value The value to ensure is an array
 * @returns The value as an array
 */
export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Filters out any null or undefined values from an array.
 * @param maybeDefined
 */
export function removeNullAndUndefined<T>(
  ...maybeDefined: (T | null | undefined)[]
): T[] {
  return maybeDefined.filter((m): m is T => m != null);
}
