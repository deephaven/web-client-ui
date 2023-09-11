/**
 * Typeguard for identifying a value that is not null or undefined.
 * @param value Value to check
 */
export function isNotNullOrUndefined<T>(
  value: T | null | undefined
): value is T {
  return value != null;
}

export default isNotNullOrUndefined;
