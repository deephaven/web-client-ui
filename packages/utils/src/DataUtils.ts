export const EMPTY_ARRAY = Object.freeze([]);

export const EMPTY_MAP: ReadonlyMap<never, never> = new Map<never, never>();

export const EMPTY_FUNCTION = () => undefined;

/**
 * Filters out any null or undefined values from an array.
 * @param maybeDefined
 */
export function removeNullAndUndefined<T>(
  ...maybeDefined: (T | null | undefined)[]
): T[] {
  return maybeDefined.filter((m): m is T => m != null);
}
