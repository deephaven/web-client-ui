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
 * This keeps a tree of `Map`s with one level per argument, keyed on the
 * argument values themselves. The arguments are deliberately not combined
 * into a single string key: cell text can be tens of thousands of characters,
 * and a freshly built key would have to be copied, hashed and retained on
 * every call. Keying on the original string lets the engine reuse the hash it
 * caches on that string, so a lookup stays cheap however long the text is.
 * `Map` compares with SameValueZero, so primitives match by value and objects,
 * functions and symbols by identity.
 *
 * There is no eviction queue to maintain because the entire cache is dropped
 * once it fills, which is the behaviour `memoizeClear` already settled on to
 * avoid LRU thrashing.
 *
 * The returned function does not forward `this`, so the memoized function must
 * not depend on it.
 */

/**
 * Longest string V8 hashes by content (`String::kMaxHashCalcLength`). Longer
 * strings are hashed by their length alone, so long cells that only differ
 * near the end, such as a long text with a row number appended, all share a
 * bucket and every lookup compares them character by character. Callers that
 * can receive strings this long should key on only the part they read.
 */
export const MAX_HASHED_STRING_LENGTH = 16383;

type CacheNode = Map<unknown, unknown>;

/**
 * @param fn The function to memoize. Must not depend on `this`
 * @param max Number of entries to hold before clearing the whole cache
 * @returns The memoized function
 */
export function fastMemoize<A extends unknown[], R>(
  fn: (...args: A) => R,
  max: number
): (...args: A) => R {
  let root: CacheNode = new Map();
  let size = 0;

  return (...args: A): R => {
    // The path through the tree is the argument count followed by each
    // argument. Leading with the count keeps `fn()` and `fn(undefined)` apart.
    const { length } = args;

    let node: CacheNode | undefined = root;
    let key: unknown = length;
    for (let i = 0; i < length && node !== undefined; i += 1) {
      node = node.get(key) as CacheNode | undefined;
      key = args[i];
    }

    if (node !== undefined) {
      // Only fall back to `has` when the value is undefined, so a hit costs one lookup
      const cached = node.get(key);
      if (cached !== undefined || node.has(key)) {
        return cached as R;
      }
    }

    const result = fn(...args);
    if (size >= max) {
      root = new Map();
      size = 0;
    }

    node = root;
    key = length;
    for (let i = 0; i < length; i += 1) {
      let child = node.get(key) as CacheNode | undefined;
      if (child === undefined) {
        child = new Map();
        node.set(key, child);
      }
      node = child;
      key = args[i];
    }
    node.set(key, result);
    size += 1;
    return result;
  };
}

export default fastMemoize;
