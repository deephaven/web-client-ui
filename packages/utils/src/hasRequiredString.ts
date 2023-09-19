import isNonEmptyString from './isNonEmptyString';

/**
 * Verify that a given list of props on a given value are all non-empty strings.
 * @param value The object to check
 * @param props List of prop names to check
 */
export function hasRequiredString<T, K extends keyof T>(
  value: T,
  ...props: K[]
): boolean {
  return props.every(prop => isNonEmptyString(value[prop]));
}

export default hasRequiredString;
