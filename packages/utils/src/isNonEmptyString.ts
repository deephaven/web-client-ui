/**
 * Returns true if given value is a non-empty string.
 * @param value
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export default isNonEmptyString;
