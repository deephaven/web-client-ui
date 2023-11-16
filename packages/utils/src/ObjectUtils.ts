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

export default { getChangedKeys };
