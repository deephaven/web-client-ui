export const EMPTY_ARRAY = Object.freeze([]);

export const EMPTY_MAP: ReadonlyMap<never, never> = new Map<never, never>();

export const EMPTY_FUNCTION = () => undefined;

export interface KeyedItem<T> {
  key: string;
  item?: T;
}

export type SelectionT<T = string> = 'all' | Set<T>;

export interface SelectionMaybeInverted<TValue> {
  selection: SelectionT<TValue>;
  isInverted: boolean;
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
