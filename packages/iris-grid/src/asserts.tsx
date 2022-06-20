export function assertNotNull<T>(value: T | null): asserts value is T {
  if (value == null) throw new Error('Value is null');
}

export function assertNotUndefined<T>(
  value: T | undefined
): asserts value is T {
  if (value === undefined) throw new Error('Value is undefined');
}
export function assertNotNullNorUndefined<T>(
  value: T | null | undefined
): asserts value is T {
  assertNotNull(value);
  assertNotUndefined(value);
}
