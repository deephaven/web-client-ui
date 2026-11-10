import deepEqual from 'fast-deep-equal';

/**
 * Get the keys that have changed between two objects.
 * @param oldObject Old object to compare
 * @param newObject New object to compare
 * @returns Array of keys that have changed
 */
export function getChangedKeys(
  oldObject: Record<string, unknown>,
  newObject: Record<string, unknown>
): string[] {
  const keys = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);
  const changedKeys: string[] = [];

  keys.forEach(key => {
    if (oldObject[key] !== newObject[key]) {
      changedKeys.push(key);
    }
  });

  return changedKeys;
}

/**
 * Remove top-level keys whose values deep-equal the value for that key in
 * `defaults`, e.g. to reduce the size of persisted state. Restore them with
 * `restoreDefaultValues` using the same `defaults`.
 *
 * Only use this when writing to storage. Do not compare an object without
 * defaults to one with defaults: they differ even when equivalent. Restore
 * defaults on stored objects as soon as they are loaded.
 * @param obj Object to remove default values from
 * @param defaults Default value for each key that may be removed
 * @returns A new object without default values; the input is not modified
 */
export function removeDefaultValues<T extends object>(
  obj: T,
  defaults: Readonly<Partial<T>>
): Partial<T> {
  const result: Partial<T> = { ...obj };
  (Object.keys(defaults) as (keyof T)[]).forEach(key => {
    if (deepEqual(obj[key], defaults[key])) {
      delete result[key];
    }
  });
  return result;
}

/**
 * Restore the default values removed by `removeDefaultValues`: every key in
 * `defaults` that is missing or undefined in `obj` is set to a copy of its
 * default. Keys already present keep their value.
 * @param obj Object to restore default values on
 * @param defaults Default value for each key; must be JSON-serializable, as each
 *   restored value is a copy made through JSON so results never share defaults
 * @returns A new object with default values filled in; the input is not modified
 */
export function restoreDefaultValues<T extends object>(
  obj: Partial<T>,
  defaults: Readonly<Partial<T>>
): T {
  const result: Partial<T> = { ...obj };
  (Object.keys(defaults) as (keyof T)[]).forEach(key => {
    if (result[key] === undefined) {
      result[key] = JSON.parse(JSON.stringify(defaults[key]));
    }
  });
  return result as T;
}

export default { getChangedKeys, removeDefaultValues, restoreDefaultValues };
