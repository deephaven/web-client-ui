import { useEffect, useState } from 'react';
import type { ThemeCache } from './ThemeCache';
import type { ThemeData } from './ThemeModel';

/**
 * Returns the currently applied themes from the cache. Listens for `change`
 * events to refresh the state.
 * @param cache
 */
export function useAppliedThemes(
  cache: ThemeCache
): [ThemeData] | [ThemeData, ThemeData] | null {
  const [appliedThemes, setAppliedThemes] = useState<
    [ThemeData] | [ThemeData, ThemeData] | null
  >(null);

  useEffect(
    () =>
      cache.registerEventListener('change', () => {
        setAppliedThemes(cache.getAppliedThemes());
      }),
    [cache]
  );

  return appliedThemes;
}

export default useAppliedThemes;
