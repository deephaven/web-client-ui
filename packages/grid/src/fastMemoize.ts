/**
 * A minimal memoizer for the hot per cell render paths.
 *
 * `memoizeClear` wraps memoizee, which routes every call through a
 * configurable argument resolver, a nested lookup structure and an LRU queue
 * that has to be reordered on each hit. That is a reasonable trade for
 * occasional calls, but a function invoked once per visible cell of every
 * frame pays it tens of thousands of times a second: profiling a grid scroll
 * found more time spent inside memoizee than in the truncation and
 * tokenization it was caching.
 *
 * This flattens the arguments into one string key and does a single `Map`
 * lookup. There is no eviction queue to maintain because the entire cache is
 * dropped once it fills, which is the behaviour `memoizeClear` already settled
 * on to avoid LRU thrashing.
 *
 * The returned function does not forward `this`, so the memoized function must
 * not depend on it.
 */

const objectKeys = new WeakMap<object, string>();
let nextObjectKey = 0;

/**
 * Builds the key fragment for a single argument. Primitives are tagged with
 * their type so that values such as the number 1 and the string '1' cannot
 * collide, and objects get a lazily assigned id so they are keyed by identity
 * instead of being serialized.
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
 * @param fn The function to memoize. Must not depend on `this`
 * @param max Number of entries to hold before clearing the whole cache
 * @returns The memoized function
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

    // Only fall back to `has` when the value is undefined, so a hit costs one lookup
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
