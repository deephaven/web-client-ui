/**
 * Throws an error if excecuted. Useful for exhaustive switch statements.
 *
 * e.g.
 * type Value = 'A' | 'B'
 *
 * declare const value: Value;
 *
 * switch(value) {
 *   case 'A':
 *     break;
 *
 *   case 'B':
 *     break;
 *
 *   default:
 *     // This case should never be hit. If it is, the types are wrong or the
 *     // runtime input is unexpected, so throw an error. Also, if we add an
 *     // additional type to Value and don't add a corresponding case in the
 *     // switch, the compiler will complain since assertNever() expects a
 *     // `never` value.
 *     assertNever(value);
 * }
 * @param shouldBeNever Value that is not expected to exist
 * @param name Optional name of the "never" value
 */
export function assertNever(shouldBeNever: never, name?: string): never {
  const label = name == null ? 'value' : `'${name}'`;
  throw new Error(`Unexpected ${label}: ${shouldBeNever}`);
}

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
