// eslint-disable-next-line import/prefer-default-export
export function assertNotNull<T>(
  value: T | null | undefined
): asserts value is T {
  if (value == null) throw new Error('Value is null or undefined');
}

/**
 * Retrieve a value from a map. If the value is not found and no default value is provided, throw.
 * Use when the value _must_ be present
 * @param map The map to get the value from
 * @param key The key to fetch the value for
 * @param defaultValue A default value to set if the key is not present
 * @returns The value set for that key
 */
export function getOrThrow<K, V>(
  map: Map<K, V>,
  key: K,
  defaultValue: V | undefined = undefined
): V {
  const value = map.get(key) ?? defaultValue;
  if (value !== undefined) {
    return value;
  }

  throw new Error(`Missing value for key ${key}`);
}
