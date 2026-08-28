/**
 * A minimal memoizer for the hot per cell render paths.
 *
 * `memoizeClear` is built on memoizee, whose argument dispatch and LRU
 * bookkeeping cost far more than the work it caches once a function is called
 * for every visible cell of every frame. This keeps the same "clear the whole
 * cache when it fills" behaviour with a plain string keyed Map.
 */

const objectKeys = new WeakMap<object, string>();
let nextObjectKey = 0;

/**
 * Objects are keyed by identity, primitives by type and value so that values
 * such as the number 1 and the string '1' cannot collide.
 */
function argKey(arg: unknown): string {
  const type = typeof arg;
  if (arg !== null && (type === 'object' || type === 'function')) {
    let key = objectKeys.get(arg as object);
    if (key === undefined) {
      nextObjectKey += 1;
      key = `\u0001${nextObjectKey}`;
      objectKeys.set(arg as object, key);
    }
    return key;
  }
  return `${type}\u0002${String(arg)}`;
}

/**
 * @param fn The function to memoize
 * @param max Number of entries to hold before clearing the cache
 */
export function fastMemoize<A extends unknown[], R>(
  fn: (...args: A) => R,
  max: number
): (...args: A) => R {
  const cache = new Map<string, R>();

  return (...args: A): R => {
    let key = argKey(args[0]);
    for (let i = 1; i < args.length; i += 1) {
      key += `\u0000${argKey(args[i])}`;
    }

    const cached = cache.get(key);
    if (cached !== undefined || cache.has(key)) {
      return cached as R;
    }

    const result = fn(...args);
    if (cache.size >= max) {
      cache.clear();
    }
    cache.set(key, result);
    return result;
  };
}

export default fastMemoize;
