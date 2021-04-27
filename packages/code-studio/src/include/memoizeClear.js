/**
 * Extension of memoizee that clears the entire cache when it's full.
 * This avoids the situation where LRU cache starts thrashing when it fills up.
 * Could look at writing our own memoize with a smarter cache to avoid overhead of
 * LRU queue, but this should be sufficient for now.
 */
import memoize from 'memoizee';

/**
 * @param {Function} fn The function to memoize
 * @param {Object} options The options to set for memoization
 */
export default (fn, options = {}) => {
  let isClearingCache = false;
  const memoizedFn = memoize(fn, {
    ...options,
    dispose: () => {
      // Need to track when we're clearing because dispose gets called for all items removed
      if (!isClearingCache) {
        isClearingCache = true;
        memoizedFn.clear();
        isClearingCache = false;
      }
    },
  });

  return memoizedFn;
};
